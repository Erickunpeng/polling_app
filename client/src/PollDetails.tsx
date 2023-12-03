import {Poll} from "./Poll";
import {Component} from "react";
import React from "react";
import {isRecord} from "./record";


type DetailsProps = {
    name: string,
    onBackClick: () => void,
};

type DetailsState = {
    now: number,
    poll: Poll | undefined,
    error: string
};

// Shows an individual poll and allows voting (if ongoing).
export class PollDetails extends Component<DetailsProps, DetailsState> {
    constructor(props: DetailsProps) {
        super(props);

        this.state = {now: Date.now(), poll: undefined, error: ""};
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
                <p>Winning Bid: {auction.maxBid} (by {auction.maxBidder})</p>
            </div>);
    };

    renderOngoing = (poll: Poll): JSX.Element => {
        const min = Math.round((poll.endTime - this.state.now) / 60 / 100) / 10;
        return (
            <div>
                <h2>{poll.name}</h2>
                <p><i>Closes in {min} minutes...</i></p>
                <div>
                    <label htmlFor="bidder">Name:</label>
                    <input type="text" id="bidder" value={this.state.bidder}
                           onChange={this.doBidderChange}></input>
                </div>
                <div>
                    <label htmlFor="amount">Amount:</label>
                    <input type="number" min={auction.maxBid + 1}
                           id="amount" value={this.state.amount}
                           onChange={this.doAmountChange}></input>
                </div>
                <button type="button" onClick={this.doBidClick}>Bid</button>
                <button type="button" onClick={this.doRefreshClick}>Refresh</button>
                <button type="button" onClick={this.doDoneClick}>Done</button>
                {this.renderError()}
            </div>);
    };

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
    doAuctionChange = (data: {auction?: unknown}): void => {
        const auction = parseAuction(data.auction);
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
}