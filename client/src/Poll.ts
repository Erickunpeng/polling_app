import {isRecord} from "./record";

export type Poll = {
    readonly name: string,
    readonly endTime: number,
    readonly options: string,
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

    if (typeof val.endTime !== "number" || val.endTime < 0 || isNaN(val.endTime)) {
        console.error("not a poll: missing or invalid 'endTime'", val)
        return undefined;
    }

    if (typeof val.options !== "string") {
        console.error("not a poll: missing or invalid 'options'", val)
        return undefined;
    }

    return {
        name: val.name, endTime: val.endTime, options: val.options
    };
}