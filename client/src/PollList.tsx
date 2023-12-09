import {parsePoll, Poll} from "./Poll";
import {Component} from "react";
import React from "react";
import {isRecord} from "./record";

/** Initial states of PollList */
type ListProps = {
    onNewClick: () => void,
    onPollClick: (name: string) => void
    savePolls: (names: string[]) => void
}

/** The states of PollList */
type ListState = {
    /** The current time */
    now: number,
    /** The list of polls */
    polls: Poll[] | undefined
}

/** Shows a list of polls and allows viewing the poll detail by clicking the link. */
export class PollList extends Component<ListProps, ListState> {
    constructor(props: ListProps) {
        super(props);
        this.state = {now: Date.now(), polls: undefined};
    }

    componentDidMount = (): void => {
        this.doRefreshClick();
        this.doTimeChange()
    }

    doTimeChange = (): void => {
        this.setState({now: Date.now()})
        setTimeout(this.doTimeChange, 1000)
    }

    componentDidUpdate = (prevProps: ListProps): void => {
        if (prevProps !== this.props) {
            this.setState({now: Date.now()});  // Force a refresh
        }
    };

    render = (): JSX.Element => {
        const fontStyle = {
            fontFamily: '"Times New Roman", Times, serif'
        }
        return (
            <div style={fontStyle}>
                <h2>Current Polls</h2>
                <h3>Still Open</h3>
                {this.renderOpenedPolls()}
                <h3>Closed</h3>
                {this.renderClosedPolls()}
                <button type="button" onClick={this.doRefreshClick}>Refresh</button>
                <span>  </span>
                <button type="button" onClick={this.doNewClick}>New Poll</button>
            </div>
        )
    }

    renderOpenedPolls = (): JSX.Element => {
        if (this.state.polls === undefined) {
            return <p>Loading poll list...</p>;
        } else {
            const openedPollList: JSX.Element[] = [];
            for (const poll of this.state.polls) {
                const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10
                // Calculate remaining time in seconds
                const remainingSeconds = Math.round((poll.endTime - this.state.now) / 1000);
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60; // Get the remainder of seconds after dividing by 60
                if (min > 0) { // opened
                    openedPollList.push(
                        <li key={poll.name}>
                            <a href="#" onClick={() => this.doPollClick(poll.name)}>{poll.name}</a>
                            <span> – {minutes} minutes {seconds} seconds remaining</span>
                            <span>  --  </span>
                            <button onClick={() => this.doDeleteClick(poll.name)}>Delete</button>
                        </li>);
                }
            }
            return (<ul>{openedPollList}</ul>)
        }
    }

    renderClosedPolls = (): JSX.Element => {
        if (this.state.polls === undefined) {
            return <p>Loading poll list...</p>;
        } else {
            const closedPollList: JSX.Element[] = [];
            for (const poll of this.state.polls) {
                const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10
                // Calculate the total seconds between the current time and the poll's end time
                const totalSeconds = Math.round((this.state.now - poll.endTime) / 1000);
                const minutes = Math.floor(Math.abs(totalSeconds) / 60); // Get the whole minutes
                const seconds = Math.abs(totalSeconds) % 60; // Get the remaining seconds
                if (min < 0) { // closed
                    closedPollList.push(
                        <li key={poll.name}>
                            <a href="#" onClick={() => this.doPollClick(poll.name)}>{poll.name}</a>
                            <span> – Closed in {minutes} minutes {seconds} seconds ago</span>
                            <span>  --  </span>
                            <button onClick={() => this.doDeleteClick(poll.name)}>Delete</button>
                        </li>);
                }
            }
            return (<ul>{closedPollList}</ul>)
        }
    }

    doRefreshClick = (): void => {
        fetch("/api/list").then(this.doListResp)
            .catch(() => this.doListError("failed to connect to server"));
    };

    doListResp = (resp: Response): void => {
        if (resp.status === 200) {
            resp.json().then(this.doListJson)
                .catch(() => this.doListError("200 response is not JSON"));
        } else if (resp.status === 400) {
            resp.text().then(this.doListError)
                .catch(() => this.doListError("400 response is not text"));
        } else {
            this.doListError(`bad status code from /api/list: ${resp.status}`);
        }
    };

    doListJson = (data: unknown): void => {
        // console.log("200")
        if (!isRecord(data)) {
            console.error("bad data from /api/list: not a record", data);
            return;
        }

        if (!Array.isArray(data.polls) || !Array.isArray(data.names)) {
            console.error("bad data from /api/list: polls is not an array", data);
            return;
        }

        const polls: Poll[] = [];
        for (const val of data.polls) {
            const poll = parsePoll(val);
            if (poll === undefined)
                return;
            polls.push(poll);
        }
        this.setState({polls: polls, now: Date.now()});  // fix time also
        this.props.savePolls(data.names)
    };

    doListError = (msg: string): void => {
        console.error(`Error fetching /api/list: ${msg}`);
    };

    doNewClick = (): void => {
        this.props.onNewClick();  // tell the parent to show the new auction page
    };

    doPollClick = (name: string): void => {
        this.props.onPollClick(name);
    };

    doDeleteClick = (name: string): void => {
        const args = { name: name };
        fetch("/api/delete", {
            method: "POST", body: JSON.stringify(args),
            headers: {"Content-Type": "application/json"} })
            .then(this.doDeleteResp)
            .catch(() => this.doDeleteError("failed to connect to server"));
    }

    doDeleteResp = (resp: Response): void => {
        if (resp.status === 200) {
            resp.json().then(this.doDeleteJson)
                .catch(() => this.doDeleteError("200 response is not JSON"));
        } else if (resp.status === 400) {
            resp.text().then(this.doDeleteError)
                .catch(() => this.doDeleteError("400 response is not text"));
        } else {
            this.doDeleteError(`bad status code from /api/delete: ${resp.status}`);
        }
    };

    doDeleteJson = (data: unknown): void => {
        if (!isRecord(data)) {
            console.error("bad data from /api/delete: not a record", data);
            return;
        }
        this.doRefreshClick()
        console.log(`The poll is successfully deleted: ${data.name}`)
    };

    doDeleteError = (msg: string): void => {
        console.error(`Error fetching /api/delete: ${msg}`);
    };
}