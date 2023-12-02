import React, {Component} from "react";
import {PollList} from "./PollList";
import {NewPoll} from "./NewPoll";

type Page = "start" | "new" | {kind: "details", name: string} | "result"

const DEBUG: boolean = false;

type PollsAppState = {
    page: Page;  // The page state of the App
    msg: string;   // essage sent from server
}


/** Displays the UI of the Polls application. */
export class PollsApp extends Component<{}, PollsAppState> {

    constructor(props: {}) {
        super(props);

        this.state = {page: "start", msg: ""};
    }

    render = (): JSX.Element => {
        if (this.state.page === "start") {
            return this.renderStartScreen()
        } else if (this.state.page === "new") {
            return this.renderNewPoll()
        } else if (this.state.page === "result") {
            return this.renderPollResult()
        } else { // details
            return this.renderPollDetails()
        }
    };

    renderStartScreen = (): JSX.Element => {
        if (DEBUG) console.debug("rendering list page");
        return <PollList onNewClick={this.doNewClick} onPollClick={this.doPollClick}/>;
    }

    renderNewPoll = (): JSX.Element => {
        if (DEBUG) console.debug("rendering add page");
        return <NewPoll onBackClick={this.doBackClick}/>;
    }

    renderPollDetails = (): JSX.Element => {
        if (DEBUG) console.debug(`rendering details page for "${this.state.page}"`);
        return (
            <div>

            </div>
        )
    }

    renderPollResult = (): JSX.Element => {
        return (
            <div>

            </div>
        )
    }

    renderMessage = (): JSX.Element => {
        if (this.state.msg === "") {
            return <div></div>;
        } else {
            return <p>Server says: {this.state.msg}</p>;
        }
    };

    doNewClick = (): void => {
        if (DEBUG) console.debug("set state to new");
        this.setState({page: "new"});
    };

    doPollClick = (name: string): void => {
        if (DEBUG) console.debug(`set state to details for auction ${name}`);
        this.setState({page: {kind: "details", name}});
    };

    doBackClick = (): void => {
        if (DEBUG) console.debug("set state to list");
        this.setState({page: "start"});
    };
}