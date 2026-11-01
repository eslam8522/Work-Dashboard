import mongoose from 'mongoose';
import Study from '../models/Study.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

// Workers must never receive the completion code (it is the answer to the task).
const PUBLIC_STUDY_FIELDS = '-completionCode -surveyUrl';

// ADMIN: publish a new study
export const createStudy = async (req, res) => {
  try {
    const { title, description, surveyUrl, rewardPerWorker, maxParticipants, completionCode } = req.body;

    const reward = Number(rewardPerWorker);
    const max = Number(maxParticipants);

    if (!title?.trim() || !surveyUrl?.trim() || !completionCode?.trim()) {
      return res.status(400).json({ error: 'Title, survey link and completion code are required.' });
    }
    if (!(reward > 0)) return res.status(400).json({ error: 'Reward must be greater than 0.' });
    if (!Number.isInteger(max) || max < 1) {
      return res.status(400).json({ error: 'Max participants must be a whole number of at least 1.' });
    }

    const study = await Study.create({
      title: title.trim(),
      description,
      surveyUrl: surveyUrl.trim(),
      rewardPerWorker: reward,
      maxParticipants: max,
      availableSpots: max,
      completionCode: completionCode.trim(),
      adminId: req.user._id, // from the token, never from the request body
      status: 'ACTIVE',
    });

    res.status(201).json(study);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// WORKER: studies with free spots that this worker has not already taken
export const getAvailableStudies = async (req, res) => {
  try {
    const taken = await Submission.find({ workerId: req.user._id }).distinct('studyId');

    const studies = await Study.find({
      status: 'ACTIVE',
      availableSpots: { $gt: 0 },
      _id: { $nin: taken },
    })
      .select(PUBLIC_STUDY_FIELDS)
      .sort({ createdAt: -1 });

    res.status(200).json(studies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// WORKER: reserve a spot
export const reserveStudy = async (req, res) => {
  const { studyId } = req.params;
  const workerId = req.user._id;

  if (!mongoose.isValidObjectId(studyId)) return res.status(400).json({ error: 'Invalid study id.' });

  try {
    if (await Submission.exists({ workerId, studyId })) {
      return res.status(400).json({ error: 'You have already reserved or completed this study.' });
    }

    // Atomic decrement: two workers can never grab the last spot at the same time.
    const study = await Study.findOneAndUpdate(
      { _id: studyId, availableSpots: { $gt: 0 }, status: 'ACTIVE' },
      { $inc: { availableSpots: -1 } },
      { new: true }
    );
    if (!study) return res.status(400).json({ error: 'Study is full or inactive.' });

    let submission;
    try {
      submission = await Submission.create({ workerId, studyId: study._id, status: 'RESERVED' });
    } catch (err) {
      // Give the spot back if the submission could not be saved (e.g. duplicate click).
      await Study.findByIdAndUpdate(studyId, { $inc: { availableSpots: 1 } });
      if (err.code === 11000) {
        return res.status(400).json({ error: 'You have already reserved or completed this study.' });
      }
      throw err;
    }

    // The survey link is revealed only now that the spot is reserved.
    const { completionCode: _hidden, ...safeStudy } = study.toObject();
    res.status(201).json({ message: 'Spot reserved successfully', submission, study: safeStudy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// WORKER: submit the completion code
export const completeStudy = async (req, res) => {
  try {
    const study = await Study.findById(req.params.studyId);
    if (!study) return res.status(404).json({ error: 'Study not found' });

    const code = String(req.body.completionCode || '').trim();
    if (study.completionCode !== code) {
      return res.status(400).json({ error: 'Invalid completion code. Please check and try again.' });
    }

    const submission = await Submission.findOneAndUpdate(
      { studyId: study._id, workerId: req.user._id, status: 'RESERVED' },
      { status: 'pending', completedAt: new Date() },
      { new: true }
    );
    if (!submission) return res.status(400).json({ error: 'No active reservation found for this study.' });

    res.status(200).json({ message: 'Study completed successfully! Awaiting admin approval.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// WORKER: cancel a reservation and return the spot
export const cancelStudy = async (req, res) => {
  try {
    const submission = await Submission.findOneAndDelete({
      studyId: req.params.studyId,
      workerId: req.user._id,
      status: 'RESERVED',
    });
    if (!submission) return res.status(400).json({ error: 'No active reservation found.' });

    await Study.findByIdAndUpdate(req.params.studyId, { $inc: { availableSpots: 1 } });
    res.status(200).json({ message: 'Reservation cancelled. Spot returned.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// WORKER: my reservations and submissions
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ workerId: req.user._id })
      .populate('studyId', 'title adminId surveyUrl rewardPerWorker')
      .sort({ createdAt: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// ADMIN: pending submissions on the admin's own studies
export const getPendingSubmissions = async (req, res) => {
  try {
    const myStudyIds = await Study.find({ adminId: req.user._id }).distinct('_id');
    const submissions = await Submission.find({ status: 'pending', studyId: { $in: myStudyIds } })
      .populate('workerId', 'email')
      .populate('studyId', 'title')
      .sort({ completedAt: 1 });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending submissions' });
  }
};

// ADMIN: approve (and pay) or reject a submission
export const reviewSubmission = async (req, res) => {
  try {
    const { status, adminFeedback = '' } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id.' });

    const existing = await Submission.findById(req.params.id).populate('studyId');
    if (!existing || !existing.studyId) return res.status(404).json({ error: 'Submission not found.' });

    // Admins can only review submissions on their own studies.
    if (String(existing.studyId.adminId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only review submissions on your own studies.' });
    }

    // Only a 'pending' submission can be reviewed, and only once. The status is part of the
    // filter, so a double click can never pay the worker twice.
    const submission = await Submission.findOneAndUpdate(
      { _id: existing._id, status: 'pending' },
      { status, adminFeedback },
      { new: true }
    );
    if (!submission) return res.status(409).json({ error: 'This submission was already reviewed.' });

    if (status === 'accepted') {
      await User.findByIdAndUpdate(submission.workerId, {
        $inc: { balance: existing.studyId.rewardPerWorker },
      });
    }

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update submission' });
  }
};
