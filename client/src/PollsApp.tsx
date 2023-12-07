import React, {Component} from "react";
import {PollList} from "./PollList";
import {NewPoll} from "./NewPoll";
import {PollDetails} from "./PollDetails";

type Page = "start" | "new" | {kind: "details", name: string}

const DEBUG: boolean = false;

type PollsAppState = {
    page: Page;  // The page state of the App
    pollNames: string[]
}


/** Displays the UI of the Polls application. */
export class PollsApp extends Component<{}, PollsAppState> {

    constructor(props: {}) {
        super(props);
        this.state = {page: "start", pollNames: []};
    }

    render = (): JSX.Element => {
        if (this.state.page === "start") {
            return this.renderStartScreen()
        } else if (this.state.page === "new") {
            return this.renderNewPoll()
        } else { // details
            return this.renderPollDetails()
        }
    };

    renderStartScreen = (): JSX.Element => {
        if (DEBUG) console.debug("rendering list page");
        return <PollList onNewClick={this.doNewClick} onPollClick={this.doPollClick} savePolls={this.doSaveChange}/>;
    }

    renderNewPoll = (): JSX.Element => {
        if (DEBUG) console.debug("rendering add page");
        return <NewPoll onBackClick={this.doBackClick} onCreateClick={this.doPollClick} pollNames={this.state.pollNames}/>;
    }

    renderPollDetails = (): JSX.Element => {
        if (DEBUG) console.debug(`rendering details page for "${this.state.page}"`);
        if (typeof this.state.page === 'object' && this.state.page.kind === 'details') {
            return <PollDetails name={this.state.page.name} onBackClick={this.doBackClick} />;
        } else {
            // Handle the unexpected case where 'this.state.page' is not of the expected type
            console.error("Unexpected state for rendering poll details");
            return <div>Error: Poll details cannot be displayed</div>;
        }
    }

    doNewClick = (): void => {
        if (DEBUG) console.debug("set state to new");
        this.setState({page: "new"});
    };

    doPollClick = (name: string): void => {
        if (DEBUG) console.debug(`set state to details for auction ${name}`);
        this.setState({page: {kind: "details", name: name}});
    };

    doBackClick = (): void => {
        if (DEBUG) console.debug("set state to list");
        this.setState({page: "start"});
    };

    doSaveChange = (names: string[]): void => {
        this.setState({pollNames: names});
    }
}