import React, {ChangeEvent} from "react";
import {Component} from "react";
import {isRecord} from "./record";


type NewPollProps = {
    onBackClick: () => void,
}

type NewPollState = {
    name: string,
    minutes: string,
    options: string
    error: string
}

export class NewPoll extends Component<NewPollProps, NewPollState> {
    constructor(props: NewPollProps) {
        super(props);
        this.state = {name: "", minutes: "60", options: "", error: ""}
    }

    render = (): JSX.Element => {
        return (
            <div>
                <h2>New Poll</h2>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input id="name" type="text" value={this.state.name}
                           onChange={this.doNameChange}></input>
                </div>
                <div>
                    <label htmlFor="minutes">Minutes:</label>
                    <input id="minutes" type="number" min="1" value={this.state.minutes}
                           onChange={this.doMinutesChange}></input>
                </div>
                <div>
                    <label htmlFor="options">Options (one per line, minimum 2 lines):</label>
                    <br/>
                    <textarea id="options" rows={3} value={this.state.options}
                              onChange={this.doOptionsChange}></textarea>
                </div>
                <button type="button" onClick={this.doCreateClick}>Start</button>
                <button type="button" onClick={this.doBackClick}>Back</button>
                {this.renderError()}
            </div>);
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

    doNameChange = (evt: ChangeEvent<HTMLInputElement>): void => {
        this.setState({name: evt.target.value, error: ""});
    };

    doMinutesChange = (evt: ChangeEvent<HTMLInputElement>): void => {
        this.setState({minutes: evt.target.value, error: ""});
    };

    doOptionsChange = (evt: ChangeEvent<HTMLTextAreaElement>): void => {
        this.setState({options: evt.target.value, error: ""});
    };

    doCreateClick = (): void => {
        // Verify that the user entered all required information.
        if (this.state.name.trim().length === 0 ||
            this.state.minutes.trim().length === 0 ||
            this.state.options.trim().length === 0) {
            this.setState({error: "a required field is missing."});
            return;
        }

        // Verify that minutes is a number.
        const minutes: number = parseFloat(this.state.minutes);
        if (isNaN(minutes) || minutes < 1 || Math.floor(minutes) !== minutes) {
            this.setState({error: "minutes is not a positive integer"});
            return;
        }

        // Ask the app to start this auction (adding it to the list).
        const args = { name: this.state.name, minutes: minutes,
            options: this.state.options };
        fetch("/api/add", {
            method: "POST", body: JSON.stringify(args),
            headers: {"Content-Type": "application/json"} })
            .then(this.doAddResp)
            .catch(() => this.doAddError("failed to connect to server"));
    };

    doAddResp = (resp: Response): void => {
        if (resp.status === 200) {
            resp.json().then(this.doAddJson)
                .catch(() => this.doAddError("200 response is not JSON"));
        } else if (resp.status === 400) {
            resp.text().then(this.doAddError)
                .catch(() => this.doAddError("400 response is not text"));
        } else {
            this.doAddError(`bad status code from /api/add: ${resp.status}`);
        }
    };

    doAddJson = (data: unknown): void => {
        if (!isRecord(data)) {
            console.error("bad data from /api/add: not a record", data);
            return;
        }

        this.props.onBackClick();  // show the updated list
    };

    doAddError = (msg: string): void => {
        this.setState({error: msg})
    };

    doBackClick = (): void => {
        this.props.onBackClick();  // tell the parent this was clicked
    };
}