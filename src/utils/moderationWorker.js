import { moderateText } from './moderationEngine.js';
import {
  Rating,
  Comment,
  Playlist,
  ModerationReport,
} from '../models/models.js';

export async function processModeration(reportId) {
  const report = await ModerationReport.findById(reportId);
  if (!report || report.state !== 'Checking') return;

  let content = null;
  let target = null;

  if (report.commentId) {
    target = await Comment.findById(report.commentId);
    content = target?.content;
  }

  if (report.ratingId) {
    target = await Rating.findById(report.ratingId);
    content = target?.review;
  }

  if (report.playlistId) {
    target = await Playlist.findById(report.playlistId);
    content = target?.description;
  }

  if (!content || !target) {
    report.state = 'Accepted';
    await report.save();
    return;
  }

  const result = await moderateText(content);

  if (result.verdict === 'unknown' || result.verdict === 'pending') {
    return;
  }

  const isAbusive = /hate|sexual|violence/i.test(result);

  if (isAbusive) {
    await target.deleteOne();

    report.state = 'Accepted';
  } else {
    report.state = 'Rejected';
  }

  await report.save();
}
