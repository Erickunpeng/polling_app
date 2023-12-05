import {isRecord} from "./record";

export type Poll = {
    readonly name: string,
    readonly minutes: number
    readonly endTime: number,
    readonly options: string[],
    readonly votes: Vote[]
    readonly results: Result[]
}

type Vote = {
    voter: string,
    option: string
}

type Result = {
    option: string,
    voteNum: number
}

export const parsePoll = (val: unknown): Poll | undefined => {
    if (!isRecord(val)) {
        console.error("not a poll", val)
        return undefined;
    }

    if (typeof val.name !== "string") {
        console.error("not a poll: missing 'name'", val)
        return undefined;
    }

    if (typeof val.minutes !== "number" || val.minutes < 0 || isNaN(val.minutes)) {
        console.error("not a poll: missing or invalid 'minutes'", val)
        return undefined;
    }

    if (typeof val.endTime !== "number" || val.endTime < 0 || isNaN(val.endTime)) {
        console.error("not a poll: missing or invalid 'endTime'", val)
        return undefined;
    }

    if (!Array.isArray(val.options) || !val.options.every((option: unknown) => typeof option === "string")) {
        console.error("not a poll: missing or invalid 'options'", val);
        return undefined;
    }

    if (!Array.isArray(val.votes)) {
        console.error("not a poll: missing or invalid 'votes'", val);
        return undefined;
    }
    for (let i = 0; i < val.votes.length; i++) {
        const vote = val.votes[i]
        if (typeof vote.voter !== "string" || typeof vote.option !== "string") {
            console.error("not a poll: missing or invalid 'votes'", val);
            return undefined;
        }
    }

    if (!Array.isArray(val.results)) {
        console.error("not a poll: missing or invalid 'results'", val);
        return undefined;
    }
    for (let i = 0; i < val.results.length; i++) {
        const result = val.results[i]
        if (typeof result.option !== "string" || typeof result.voteNum !== "number") {
            console.error("not a poll: missing or invalid 'results'", val);
            return undefined;
        }
    }

    return {
        name: val.name, minutes: val.minutes, endTime: val.endTime,
        options: val.options, votes: val.votes, results: val.results
    };
}