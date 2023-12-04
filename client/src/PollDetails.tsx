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
};

// Shows an individual poll and allows voting (if ongoing).
export class PollDetails extends Component<DetailsProps, DetailsState> {
    constructor(props: DetailsProps) {
        super(props);

        this.state = {now: Date.now(), voter: "", option: "", poll: undefined, error: ""};
    }

    componentDidMount = (): void => {
        this.doRefreshClick();
    };

    render = (): JSX.Element => {
        if (this.state.poll === undefined) {
            return <p>Loading auction "{this.props.name}"...</p>
        } else {
            if (this.state.poll.endTime <= this.state.now) {
                return this.renderCompleted(this.state.poll);
            } else {
                return this.renderOngoing(this.state.poll);
            }
        }
    };

    renderCompleted = (poll: Poll): JSX.Element => {
        return (
            <div>
                <h2>{poll.name}</h2>
            </div>);
    };

    renderOngoing = (poll: Poll): JSX.Element => {
        const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10;
        const optionList = []
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
            <div>
                <h2>{poll.name}</h2>
                <p><i>Closes in {min} minutes...</i></p>
                <br/>
                <ul>{optionList}</ul>
                <div>
                    <label htmlFor="voter">Name:</label>
                    <input type="text" id="voter" value={this.state.voter}
                           onChange={this.doVoterChange}></input>
                </div>
                <button type="button" onClick={this.doBackClick}>Back</button>
                <button type="button" onClick={this.doRefreshClick}>Refresh</button>
                <button type="button" onClick={this.doVoteClick}>Vote</button>
                {this.renderNotification()}
                {this.renderError()}
            </div>);
    };

    renderNotification = (): JSX.Element => {
        return (<div><p><i>Recorded vote of "{this.state.voter}" as "{this.state.option}"</i></p></div>)
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
        const args = {name: this.props.name};
        fetch("/api/get", {
            method: "POST", body: JSON.stringify(args),
            headers: {"Content-Type": "application/json"} })
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
            this.doGetError(`bad status code from /api/refersh: ${res.status}`);
        }
    };

    doGetJson = (data: unknown): void => {
        if (!isRecord(data)) {
            console.error("bad data from /api/refresh: not a record", data);
            return;
        }

        this.doAuctionChange(data);
    }

    // Shared helper to update the state with the new auction.
    doAuctionChange = (data: {poll?: unknown}): void => {
        const poll = parsePoll(data.poll);
        if (auction !== undefined) {
            // If the current bid is too small, let's also fix that.
            const amount = parseFloat(this.state.amount);
            if (isNaN(amount) || amount < auction.maxBid + 1) {
                this.setState({auction, now: Date.now(), error: "",
                    amount: '' + (auction.maxBid + 1)});
            } else {
                this.setState({auction, now: Date.now(), error: ""});
            }
        } else {
            console.error("auction from /api/fresh did not parse", data.auction)
        }
    };

    doGetError = (msg: string): void => {
        console.error(`Error fetching /api/refresh: ${msg}`);
    };

    doVoteClick = (_: MouseEvent<HTMLButtonElement>): void => {
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

        this.doAuctionChange(data);
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