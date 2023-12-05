import {parsePoll, Poll} from "./Poll";
import {Component} from "react";
import React from "react";
import {isRecord} from "./record";


type ListProps = {
    onNewClick: () => void,
    onPollClick: (name: string) => void
}

type ListState = {
    now: number,
    polls: Poll[] | undefined
}

export class PollList extends Component<ListProps, ListState> {
    constructor(props: ListProps) {
        super(props);
        this.state = {now: Date.now(), polls: undefined};
    }

    componentDidMount = (): void => {
        this.doRefreshClick();
    }

    componentDidUpdate = (prevProps: ListProps): void => {
        if (prevProps !== this.props) {
            this.setState({now: Date.now()});  // Force a refresh
        }
    };

    render = (): JSX.Element => {
        return (
            <div>
                <h2>Current Polls</h2>
                <h3>Still Open</h3>
                {this.renderOpenedPolls()}
                <h3>Closed</h3>
                {this.renderClosedPolls()}
                <button type="button" onClick={this.doRefreshClick}>Refresh</button>
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
                if (min > 0) { // opened
                    openedPollList.push(
                        <li key={poll.name}>
                            <a href="#" onClick={() => this.doPollClick(poll.name)}>{poll.name}</a>
                            <span> – {Math.round(min)} minutes remaining</span>
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
                if (min < 0) { // closed
                    closedPollList.push(
                        <li key={poll.name}>
                            <a href="#" onClick={() => this.doPollClick(poll.name)}>{poll.name}</a>
                            <span> – Closed {Math.round(min)} minutes ago</span>
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
        console.log("200")
        if (!isRecord(data)) {
            console.error("bad data from /api/list: not a record", data);
            return;
        }

        if (!Array.isArray(data.polls)) {
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

}