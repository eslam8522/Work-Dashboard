import mongoose from 'mongoose';
import User from '../models/User.js';
import Study from '../models/Study.js';
import Submission from '../models/Submission.js';

/**
 * Two users may chat only if one is a worker who has a submission on a study
 * published by the other (an admin). Stops people messaging arbitrary users.
 */
export async function canChat(idA, idB) {
  if (!mongoose.isValidObjectId(idA) || !mongoose.isValidObjectId(idB)) return false;
  if (String(idA) === String(idB)) return false;

  const users = await User.find({ _id: { $in: [idA, idB] } }).select('role');
  if (users.length !== 2) return false;

  const worker = users.find((u) => u.role === 'WORKER');
  const admin = users.find((u) => u.role === 'ADMIN');
  if (!worker || !admin) return false;

  const studyIds = await Study.find({ adminId: admin._id }).distinct('_id');
  return Boolean(await Submission.exists({ workerId: worker._id, studyId: { $in: studyIds } }));
}
