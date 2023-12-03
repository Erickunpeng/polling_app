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
    votes: Map<string, string>, // key: voter's name, value: voter's option
    results: Map<string, number> // key: option, value: the number of votes
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
 * Handles request for /api/save by storing the given file.
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
export const add = (req: SafeRequest, res: SafeResponse): void => {
    const name = req.body.name;
    if (typeof name !== 'string') {
        res.status(400).send('required argument "name" was missing');
        return;
    }
    const minutes = req.body.minutes;
    if (typeof minutes !== "number") {
        res.status(400).send(`'minutes' is not a number: ${minutes}`);
        return;
    } else if (isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
        res.status(400).send(`'minutes' is not a positive integer: ${minutes}`);
        return;
    }
    const options = req.body.options
    if (!Array.isArray(options) || !options.every(opt => typeof opt === 'string')) {
        res.status(400).send('required argument "options" was missing');
        return;
    }
    const poll: Poll = {
        name: name,
        minutes: minutes,
        endTime: Date.now() + minutes * 60 * 1000,  // convert to ms,
        options: options,
        votes: new Map<string, string>(),
        results: new Map<string, number>()
    }
    polls.set(poll.name, poll)
    res.send({poll: poll});
}

/**
 * Handles request for /api/load by returning the file requested.
 * @param req The HTTP request object.
 * @param res The HTTP response object.
 */
export const get = (req: SafeRequest, res: SafeResponse): void => {
    const name = req.body.name;
    if (typeof name !== "string") {
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
 * Handles request for /api/list by listing all saved files.
 * @param _req The HTTP request object.
 * @param res The HTTP request object.
 */
export const list = (_req: SafeRequest, res: SafeResponse): void => {
    const list = Array.from(polls.values())
    list.sort(comparePolls)
    res.send({list: list})
}

/** Used in tests to set the transcripts map back to empty. */
export const resetPollsForTesting = (): void => {
    // (6a): remove all saved transcripts from the map
    polls.clear()
};

