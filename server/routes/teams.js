const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// 1. GET ALL TEAMS (Utilizes Text Indexes + .lean() for High Concurrency)
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      // Uses the text index defined on teamSchema ({ name: 'text', hackathon: 'text' })
      query = { $text: { $search: search } };
    }

    const teams = await Team.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
});

// 2. CREATE A NEW TEAM (Sanitized Input + Strict 3-Team Cap)
router.post('/create', async (req, res, next) => {
  try {
    const { name, hackathon, description, rolesNeeded, skills, userId, userName } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required to create a team.' });
    }
    if (!name || !hackathon || !description) {
      return res.status(400).json({ message: 'Team name, hackathon, and description are required.' });
    }

    const existingTeamsCount = await Team.countDocuments({ leader: userId });
    if (existingTeamsCount >= 3) {
      return res.status(400).json({ message: 'Limit reached! Maximum 3 teams allowed per account.' });
    }

    const newTeam = await Team.create({
      name: name.trim(),
      hackathon: hackathon.trim(),
      description: description.trim(),
      leader: userId,
      leaderName: userName || 'Dev Leader',
      skills: Array.isArray(skills) && skills.length > 0 ? skills : ['React', 'Node.js'],
      rolesNeeded: Array.isArray(rolesNeeded) && rolesNeeded.length > 0 ? rolesNeeded : ['Backend Developer'],
      members: [userId],
      maxMembers: 4,
      isOpen: true
    });

    res.status(201).json(newTeam);
  } catch (error) {
    next(error);
  }
});

// 3. REQUEST TO JOIN A TEAM
router.post('/:teamId/request', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, userName, role, proofOfWork } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (!team.isOpen) return res.status(400).json({ message: 'Team roster is full.' });

    const alreadyRequested = team.requests.some(req => req.user.toString() === userId);
    if (alreadyRequested) {
      return res.status(400).json({ message: 'You have already requested to join this team.' });
    }

    team.requests.push({
      user: userId,
      userName: userName || 'Dev Member',
      role: role || 'Contributor',
      proofOfWork: proofOfWork || ''
    });

    await team.save();
    res.status(200).json({ message: 'Join request sent successfully!', team });
  } catch (error) {
    next(error);
  }
});

// 4. ACCEPT OR REJECT JOIN REQUEST
router.post('/:teamId/request/:requestId/action', async (req, res, next) => {
  try {
    const { teamId, requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const request = team.requests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (action === 'accept') {
      request.status = 'accepted';
      if (!team.members.includes(request.user)) {
        team.members.push(request.user);
      }
      if (team.members.length >= team.maxMembers) {
        team.isOpen = false;
      }
    } else {
      request.status = 'rejected';
    }

    await team.save();
    res.status(200).json({ message: `Request ${action}ed successfully!`, team });
  } catch (error) {
    next(error);
  }
});

// 5. DELETE A TEAM
router.delete('/:teamId', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: 'Only the team leader can delete this team.' });
    }

    await Team.findByIdAndDelete(teamId);
    res.status(200).json({ message: 'Team deleted successfully!' });
  } catch (error) {
    next(error);
  }
});
// 1. KICK MEMBER FROM TEAM (Leader only)
router.post('/:teamId/kick', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, targetMemberId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: 'Only team leaders can kick members.' });
    }

    team.members = team.members.filter(m => m.toString() !== targetMemberId);
    team.coLeaders = (team.coLeaders || []).filter(cl => cl.toString() !== targetMemberId);
    team.isOpen = true; // Re-open roster space

    await team.save();
    res.status(200).json({ message: 'Member removed from team.', team });
  } catch (error) {
    next(error);
  }
});

// 2. MAKE CO-LEADER (Leader only)
router.post('/:teamId/co-leader', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, targetMemberId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (team.leader.toString() !== userId) {
      return res.status(403).json({ message: 'Only the main leader can promote co-leaders.' });
    }

    if (!team.coLeaders) team.coLeaders = [];
    if (!team.coLeaders.includes(targetMemberId)) {
      team.coLeaders.push(targetMemberId);
    }

    await team.save();
    res.status(200).json({ message: 'Member promoted to Co-Leader!', team });
  } catch (error) {
    next(error);
  }
});

// 1. SUBMIT JOIN REQUEST
router.post('/:teamId/request', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, userName, role, proofOfWork } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required.' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    if (!team.isOpen) return res.status(400).json({ message: 'Team roster is full.' });

    // Check if user is already a member
    if (team.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'You are already a member of this team.' });
    }

    // Check if user already submitted a pending request
    const existingReq = team.requests.find(
      r => r.user.toString() === userId && r.status === 'pending'
    );
    if (existingReq) {
      return res.status(400).json({ message: 'You already have a pending request for this team.' });
    }

    team.requests.push({
      user: userId,
      userName: userName || 'Applicant',
      role: role.replace('NEEDS: ', ''),
      proofOfWork: proofOfWork || '',
      status: 'pending'
    });

    await team.save();
    res.status(200).json({ message: 'Join request sent successfully!', team });
  } catch (error) {
    next(error);
  }
});

// 2. ACCEPT / REJECT JOIN REQUEST
router.post('/:teamId/request/:requestId/action', async (req, res, next) => {
  try {
    const { teamId, requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const request = team.requests.id(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (action === 'accept') {
      request.status = 'accepted';
      
      // Add to members array if not already present
      if (!team.members.includes(request.user)) {
        team.members.push(request.user);
      }

      // Automatically close roster if capacity reached
      if (team.members.length >= (team.maxMembers || 5)) {
        team.isOpen = false;
      }
    } else {
      request.status = 'rejected';
    }

    await team.save();
    res.status(200).json({ message: `Request ${action}ed successfully!`, team });
  } catch (error) {
    next(error);
  }
});

// GET /api/teams - Populates full member profile details
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      query = { $or: [{ name: { $regex: search, $options: 'i' } }, { hackathon: { $regex: search, $options: 'i' } }] };
    }

    const teams = await Team.find(query)
      .populate('members', 'name role email') // Populates real member names & roles
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
});

module.exports = router;