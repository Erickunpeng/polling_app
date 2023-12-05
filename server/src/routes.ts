import {Request, Response} from "express";
import {ParamsDictionary} from "express-serve-static-core";


// Require type checking of request body.
type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>;
type SafeResponse = Response;  // only writing, so no need to check

type Poll = {
    name: string,
    minutes: number,
    endTime: number,
    options: string[]
    votes: Vote[],
    results: Result[]
}
type Vote = {
    voter: string,
    option: string
}

type Result = {
    option: string,
    voteNum: number
}

const polls: Map<string, Poll> = new Map<string, Poll>()

// Sort auctions with the ones finishing soonest first, but with all those that
// are completed after those that are not and in reverse order by end time.
const comparePolls = (a: Poll, b: Poll): number => {
    const now: number = Date.now();
    const endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
    const endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
    return endA - endB;
};

/** Testing function to move all end times forward the given amount (of ms). */
export const advanceTimeForTesting = (ms: number): void => {
    for (const poll of polls.values()) {
        poll.endTime -= ms;
    }
};


/**
 * Handles request for /api/add by storing the given file.
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
export const addPoll = (req: SafeRequest, res: SafeResponse): void => {
    const name = req.body.name;
    if (name === undefined || typeof name !== 'string') {
        res.status(400).send('required argument "name" was missing');
        return;
    }
    const minutes = req.body.minutes;
    if (minutes === undefined || typeof minutes !== "number") {
        res.status(400).send('required argument "minutes" was missing');
        return;
    } else if (isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
        res.status(400).send(`'minutes' is not a positive integer: ${minutes}`);
        return;
    }
    const options = req.body.options
    if (options === undefined || !Array.isArray(options) || !options.every(opt => typeof opt === 'string')) {
        res.status(400).send('required argument "options" was missing');
        return;
    } else if (options.length < 2) {
        res.status(400).send(`The number of options is less than 2: ${options.length}`);
        return;
    }
    const results = []
    for (let i = 0; i < options.length; i++) {
        results.push({option: options[i], voteNum: 0})
    }
    const poll: Poll = {
        name: name,
        minutes: minutes,
        endTime: Date.now() + minutes * 60 * 1000,  // convert to ms,
        options: options,
        votes: [],
        results: results
    }
    polls.set(poll.name, poll)
    res.send({poll: poll});
}

/**
 * Handles request for /api/get by returning the file requested.
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
export const getPoll = (req: SafeRequest, res: SafeResponse): void => {
    const name = first(req.query.name);
    console.log(req.query)
    if (name === undefined) {
        res.status(400).send("missing or invalid 'name' parameter");
        return;
    }
    const poll = polls.get(name)
    if (poll === undefined) {
        res.status(400).send(`no poll with name '${name}'`);
        return;
    }
    res.send({poll: poll})
}

/**
 * Handles request for /api/vote by adding the vote of the voter.
 * @param _req The HTTP request object.
 * @param res The HTTP request object.
 */
export const listPolls = (_req: SafeRequest, res: SafeResponse): void => {
    const list = Array.from(polls.values())
    list.sort(comparePolls)
    res.send({polls: list})
}

/**
 * Handles request for /api/list by listing all saved files.
 * @param req The HTTP request object.
 * @param res The HTTP request object.
 */
export const vote = (req: SafeRequest, res: SafeResponse): void => {
    const voter = req.body.voter;
    if (typeof voter !== 'string') {
        res.status(400).send("missing or invalid 'voter' parameter");
        return;
    }
    const name = req.body.name;
    if (typeof name !== "string") {
        res.status(400).send("missing or invalid 'name' parameter");
        return;
    }
    const poll = polls.get(name);
    if (poll === undefined) {
        res.status(400).send(`no poll with name '${name}'`);
        return;
    }
    const option = req.body.option;
    if (typeof option !== 'string') {
        res.status(400).send("missing or invalid 'option' parameter");
        return;
    } else if (!poll.options.includes(option)) {
        res.status(400).send(`This is not a option in this poll: ${option}`);
        return;
    }
    const now = Date.now();
    if (now >= poll.endTime) {
        res.status(400).send(`poll for "${poll.name}" has already ended`);
        return;
    }
    // Find the vote by the voter
    const voteIndex = poll.votes.findIndex(vote => vote.voter === voter);
    if (voteIndex !== -1) {
        // Voter found, update their vote
        const prevOption = poll.votes[voteIndex].option
        poll.votes[voteIndex].option = option;
        // Update the number of the prev option
        for (let i = 0; i < poll.results.length; i++) {
            if (poll.results[i].option === prevOption) {
                poll.results[i].voteNum -= 1
            }
        }
    } else {
        // New voter, add their vote
        poll.votes.push({ voter, option });
    }
    // Update the results
    for (let i = 0; i < poll.results.length; i++) {
        if (poll.results[i].option === option) {
            poll.results[i].voteNum += 1
        }
    }
    res.send({poll: poll})
}

/** Used in tests to set the transcripts map back to empty. */
export const resetPollsForTesting = (): void => {
    polls.clear()
};

// Helper to return the (first) value of the parameter if any was given.
// (This is mildly annoying because the client can also give mutiple values,
// in which case, express puts them into an array.)
const first = (param: unknown): string | undefined => {
    if (Array.isArray(param)) {
        return first(param[0]);
    } else if (typeof param === 'string') {
        return param;
    } else {
        return undefined;
    }
};

