import {isRecord} from "./record";

export type Poll = {
    readonly name: string,
    readonly minutes: number
    readonly endTime: number,
    readonly options: string[],
    readonly votes: Map<string, string>
    readonly results: Map<string, number>
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

    if (!(val.votes instanceof Map)) {
        console.error("not a poll: missing or invalid 'votes'", val)
        return undefined;
    }
    for (let [key, value] of val.votes) {
        if (typeof key !== 'string' || typeof value !== 'string') {
            console.error("not a poll: invalid vote name or option 'votes'", val)
            return undefined;
        }
    }

    if (!(val.results instanceof Map)) {
        console.error("not a poll: missing or invalid 'results'", val)
        return undefined;
    }
    for (let [key, value] of val.results) {
        if (typeof key !== 'string' || typeof value !== 'number') {
            console.error("not a poll: invalid vote name or option 'results'", val)
            return undefined;
        }
    }

    return {
        name: val.name, minutes: val.minutes, endTime: val.endTime,
        options: val.options, votes: val.votes, results: val.results
    };
}