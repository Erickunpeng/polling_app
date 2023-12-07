import {parsePoll, Poll} from "./Poll";
import {ChangeEvent, Component} from "react";
import React from "react";
import {isRecord} from "./record";


type DetailsProps = {
    name: string, // name of the poll
    onBackClick: () => void,
};

type DetailsState = {
    now: number,
    voter: string
    option: string
    poll: Poll | undefined,
    error: string
    notification: string
};

// Shows an individual poll and allows voting (if ongoing).
export class PollDetails extends Component<DetailsProps, DetailsState> {
    constructor(props: DetailsProps) {
        super(props);

        this.state = {now: Date.now(), voter: "", option: "", poll: undefined, error: "", notification: ""};
    }

    componentDidMount = (): void => {
        this.doRefreshClick();
    };

    // componentDidUpdate = (prevProps: DetailsProps): void => {
    //     if (prevProps !== this.props) {
    //         this.setState({now: Date.now()});  // Force a refresh
    //     }
    //     this.doRefreshClick()
    // };

    render = (): JSX.Element => {
        const fontStyle = {
            fontFamily: '"Times New Roman", Times, serif'
        }
        if (this.state.poll === undefined) {
            return <p style={fontStyle}>Loading poll "{this.props.name}"...</p>
        } else {
            if (this.state.poll.endTime <= this.state.now) {
                return this.renderCompleted(this.state.poll);
            } else {
                return this.renderOngoing(this.state.poll);
            }
        }
    };

    renderCompleted = (poll: Poll): JSX.Element => {
        const fontStyle = {
            fontFamily: '"Times New Roman", Times, serif'
        }
        const votePercent: JSX.Element[] = []
        // Calculate the total seconds between the current time and the poll's end time
        const totalSeconds = Math.round((this.state.now - poll.endTime) / 1000);
        const minutes = Math.floor(Math.abs(totalSeconds) / 60); // Get the whole minutes
        const seconds = Math.abs(totalSeconds) % 60; // Get the remaining seconds
        const totalVotes = poll.votes.length
        // Inv: votePercent = LI for each of poll.results[0 ... i-1]
        for (let i = 0; i < poll.results.length; i++) {
            const result = poll.results[i]
            votePercent.push(
                <li key={result.option}>
                    <p>{totalVotes === 0 ? 0 : Math.round(result.voteNum / totalVotes * 100)}% ---- {result.option}</p>
                </li>
            )
        }
        return (
            <div style={fontStyle}>
                <h2>{poll.name}</h2>
                <p>Closed in {minutes} minutes {seconds} seconds ago</p>
                <ul>{votePercent}</ul>
                <button type="button" onClick={this.doBackClick}>Back</button>
                <button type="button" onClick={this.doRefreshClick}>Refresh</button>
            </div>);
    };

    renderOngoing = (poll: Poll): JSX.Element => {
        const fontStyle = {
            fontFamily: '"Times New Roman", Times, serif'
        }
        // Calculate remaining time in seconds
        const remainingSeconds = Math.round((poll.endTime - this.state.now) / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60; // Get the remainder of seconds after dividing by 60
        const optionList = []
        // Inv: optionList = LI for each of poll.options[0 ... i-1]
        for (let i = 0; i < poll.options.length; i++) {
            optionList.push(
                <li key={poll.options[i]}>
                    <input
                        type="radio"
                        id={poll.options[i]}
                        name="pollOption"
                        value={poll.options[i]}
                        checked={this.state.option === poll.options[i]}
                        onChange={() => this.doOptionChange(poll.options[i])}
                    />
                    <label htmlFor={poll.options[i]}>{poll.options[i]}</label>
                </li>
            );
        }
        return (
            <div style={fontStyle}>
                <h2>{poll.name}</h2>
                <p>Closes in {minutes} minutes {seconds} seconds...</p>
                <ul>{optionList}</ul>
                <div>
                    <label htmlFor="voter">Vote Name: </label>
                    <input type="text" id="voter" value={this.state.voter}
                           onChange={this.doVoterChange}></input>
                </div><br/>
                <button type="button" onClick={this.doBackClick}>Back</button>
                <span>  </span>
                <button type="button" onClick={this.doRefreshClick}>Refresh</button>
                <span>  </span>
                <button type="button" onClick={this.doVoteClick}>Vote</button>
                {this.renderNotification()}
                {this.renderError()}
            </div>);
    };

    renderNotification = (): JSX.Element => {
        return (<div><p>{this.state.notification}</p></div>)
    }

    renderError = (): JSX.Element => {
        if (this.state.error.length === 0) {
            return <div></div>;
        } else {
            const style = {width: '300px', backgroundColor: 'rgb(246,194,192)',
                border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };
            return (<div style={{marginTop: '15px'}}>
                <span style={style}><b>Error</b>: {this.state.error}</span>
            </div>);
        }
    };

    doRefreshClick = (): void => {
        // console.log(this.props.name)
        fetch(`/api/get?name=${encodeURIComponent(this.props.name)}`)
            .then(this.doGetResp)
            .catch(() => this.doGetError("failed to connect to server"));
    };

    doGetResp = (res: Response): void => {
        if (res.status === 200) {
            res.json().then(this.doGetJson)
                .catch(() => this.doGetError("200 res is not JSON"));
        } else if (res.status === 400) {
            res.text().then(this.doGetError)
                .catch(() => this.doGetError("400 response is not text"));
        } else {
            this.doGetError(`bad status code from /api/get: ${res.status}`);
        }
    };

    doGetJson = (data: unknown): void => {
        if (!isRecord(data)) {
            console.error("bad data from /api/get: not a record", data);
            return;
        }

        this.doPollChange(data);
    }

    // Shared helper to update the state with the new polls.
    doPollChange = (data: {poll?: unknown}): void => {
        const poll = parsePoll(data.poll);
        if (poll !== undefined) {
            // console.log(poll)
            this.setState({poll: poll, now: Date.now()})
        } else {
            console.error("poll from /api/get did not parse", data.poll)
        }
    };

    doGetError = (msg: string): void => {
        console.error(`Error fetching /api/get: ${msg}`);
    };

    doVoteClick = (): void => {
        if (this.state.poll === undefined)
            throw new Error("impossible");

        // Verify that the user entered all required information.
        if (this.state.voter.trim().length === 0 ||
            this.state.option.trim().length === 0) {
            this.setState({error: "a required field is missing."});
            return;
        }

        const args = {name: this.props.name, voter: this.state.voter,
            option: this.state.option};
        fetch("/api/vote", {
            method: "POST", body: JSON.stringify(args),
            headers: {"Content-Type": "application/json"} })
            .then(this.doVoteResp)
            .catch(() => this.doVoteError("failed to connect to server"));
    };

    doVoteResp = (res: Response): void => {
        if (res.status === 200) {
            res.json().then(this.doVoteJson)
                .catch(() => this.doVoteError("200 response is not JSON"));
        } else if (res.status === 400) {
            res.text().then(this.doVoteError)
                .catch(() => this.doVoteError("400 response is not text"));
        } else {
            this.doVoteError(`bad status code from /api/vote: ${res.status}`);
        }
    };

    doVoteJson = (data: unknown): void => {
        if (this.state.poll === undefined)
            throw new Error("impossible");

        if (!isRecord(data)) {
            console.error("bad data from /api/vote: not a record", data);
            return;
        }
        this.setState({notification: `Recorded vote of "${this.state.voter}" as "${this.state.option}"`})
        this.doPollChange(data);
    };

    doVoteError = (msg: string): void => {
        console.error(`Error fetching /api/vote: ${msg}`);
    };

    doBackClick = (): void => {
        this.props.onBackClick();  // tell the parent this was clicked
    };

    doVoterChange = (evt: ChangeEvent<HTMLInputElement>): void => {
        this.setState({voter: evt.target.value, error: ""});
    };

    doOptionChange = (option: string): void => {
        this.setState({option: option, error: ""});
    };
}