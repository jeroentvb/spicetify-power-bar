import React, { KeyboardEventHandler, useRef } from "react";
import { debounce } from "lodash-es";
import classnames from "classnames";

import { search } from '../services/search';
import Suggestions from "./Suggestions";

import type { ICategorizedSuggestion } from "../types/suggestions.model";
import type { SuggestionClickEmitEvent } from "../types/custom-events.model";

interface LocalState {
    active: boolean;
    categorizedSuggestions: ICategorizedSuggestion[];
}

export default class PowerBar extends React.Component<{}, LocalState> {
    readonly isMac = Spicetify.Platform.PlatformData.os_name === 'osx';

    searchInput = React.createRef<HTMLInputElement>();

    previousValue = '';

    constructor(props: {}) {
        super(props);

        this.state = {
            active: false,
            categorizedSuggestions: [],
        }
    }

    debouncedSearch = debounce(async () => {
        console.log('search')
        const categorizedSuggestions = await search(this.searchInput.current!.value);
        this.setState({ categorizedSuggestions })
    }, 300)

    onSuggestionClick: SuggestionClickEmitEvent = (uri) => {
        const href = Spicetify.URI.from(uri)!.toURLPath(true);
        Spicetify.Platform.History.push(href);

        this.togglePowerBar();
    }

    componentDidMount() {
        document.addEventListener('keydown', (e) => {
            const activatePowerBar = e.code === 'Space' && (this.isMac ? e.altKey : e.ctrlKey);
            if (!activatePowerBar) return;
    
            e.preventDefault();
            this.togglePowerBar();
        });
    }

    togglePowerBar() {
        this.setState((state) => ({ active: !state.active }));
        
        if (this.state.active) {
            this.searchInput.current!.focus();
            this.searchInput.current!.value = '';
        } else {
            this.clearSuggestions();
        }
    }

    clearSuggestions() {
        this.setState({ categorizedSuggestions: [] });
    }

    onInput: KeyboardEventHandler<HTMLInputElement> = (event) => {
        const { currentTarget, key, ctrlKey, altKey } = event;
        const powerBarKeyCombo = key === 'Space' && (this.isMac ? altKey : ctrlKey);
        if (powerBarKeyCombo) return;

        const trimmedValue = currentTarget.value.trim();

        // Clear input or hide power bar when esc is pressed
        if (key === 'Escape') {
            if (currentTarget.value) {
                currentTarget.value = '';
                this.clearSuggestions();
            } else {
                this.togglePowerBar();
            }
            return;
        }

        // Handle arrow keys
        if (key === 'ArrowUp') {
            event.preventDefault();
            // this.selectedSuggestionIndex--
            return; 
        }
        if (key === 'ArrowDown') {
            event.preventDefault();
            // this.selectedSuggestionIndex++
            return;
        }

        if (key === 'Enter') {
            // if (this.flattenedSuggestions) {
            //     const suggestion = this.flattenedSuggestions[this.selectedSuggestionIndex];
            //     const href = Spicetify.URI.from(suggestion.uri).toURLPath(true);
            //     Spicetify.Platform.History.push(href);

            //     this.flattenedSuggestions = [];
            //     togglePowerBar();
            //     return;
            // }
        }

        if (!trimmedValue || trimmedValue.length < 2) {
            this.clearSuggestions();
            return
        }

        if (trimmedValue === this.previousValue) return;

        this.previousValue = trimmedValue;
        this.debouncedSearch();
    }

    render() {
        return (
            <div id="power-bar-container" className={classnames({'hidden': !this.state.active})} onClick={this.togglePowerBar.bind(this)}>
                <div id="power-bar-wrapper" onClick={(e) => e.stopPropagation()}>
                    <input
                        ref={this.searchInput}
                        type="text"
                        id="power-bar-search"
                        className={classnames({ 'has-suggestions': this.state.categorizedSuggestions.length > 0 })}
                        onKeyUp={this.onInput}
                    />
                    {this.state.categorizedSuggestions.length > 0 && <Suggestions categorizedSuggestions={this.state.categorizedSuggestions} onSuggestionClick={this.onSuggestionClick} />}
                </div>
            </div>
        );
    }
}
