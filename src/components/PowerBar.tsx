import React, { KeyboardEventHandler } from "react";
import { debounce } from "lodash-es";
import classnames from "classnames";

import scrollIntoViewIfNeeded from "../utils/scroll-into-view";
import navigateUsingUri from "../utils/navigate-using-uri";
import search from '../services/search';
import Suggestions from "./Suggestions";

import type { ICategorizedSuggestion, ISuggestion } from "../types/suggestions.model";
import type { SuggestionClickEmitEvent } from "../types/custom-events.model";

interface LocalState {
    active: boolean;
    categorizedSuggestions: ICategorizedSuggestion[];
    selectedSuggestionUri: string;
}

export default class PowerBar extends React.Component<{}, LocalState> {
    readonly isMac = Spicetify.Platform.PlatformData.os_name === 'osx';

    suggestions: ISuggestion[] = [];

    searchInput = React.createRef<HTMLInputElement>();

    previousSearchValue = '';

    _selectedSuggestionIndex = 0

    set selectedSuggestionIndex(index: number) {
        if (index === -1) index = this.suggestions.length - 1;
        if (index === this.suggestions.length) index = 0;
        this._selectedSuggestionIndex = index;

        this.setState({ selectedSuggestionUri: this.suggestions[index].uri }, () => {
            const activeSuggestion = document.getElementsByClassName('suggestion-item__active')[0] as HTMLElement;
            const suggestionsElement = document.getElementById('power-bar-suggestions') as HTMLDivElement;
            scrollIntoViewIfNeeded(activeSuggestion, suggestionsElement);
        });
    }

    get selectedSuggestionIndex(): number {
        return this._selectedSuggestionIndex;
    }

    constructor(props: {}) {
        super(props);

        this.state = {
            active: false,
            categorizedSuggestions: [],
            selectedSuggestionUri: '',
        }
    }

    componentDidMount() {
        document.addEventListener('keydown', (e) => {
            const activatePowerBar = e.code === 'Space' && (this.isMac ? e.altKey : e.ctrlKey);
            if (!activatePowerBar) return;
    
            e.preventDefault();
            this.togglePowerBar();
        });
    }

    debouncedSearch = debounce(async () => {
        const { categorizedSuggestions, suggestions } = await search(this.searchInput.current!.value);
        
        this.setState({ categorizedSuggestions });
        this.suggestions = suggestions;
        this.selectedSuggestionIndex = 0;
    }, 300)

    onSuggestionClick: SuggestionClickEmitEvent = (uri) => {
        navigateUsingUri(uri);
        this.togglePowerBar();
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
        this.suggestions = [];
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
            this.selectedSuggestionIndex--
            return; 
        }
        if (key === 'ArrowDown') {
            event.preventDefault();
            this.selectedSuggestionIndex++
            return;
        }

        if (key === 'Enter') {
            if (this.suggestions) {
                const suggestion = this.suggestions[this.selectedSuggestionIndex];
                navigateUsingUri(suggestion.uri);

                this.togglePowerBar();
                return;
            }
        }

        if (!trimmedValue || trimmedValue.length < 2) {
            this.clearSuggestions();
            return
        }

        if (trimmedValue === this.previousSearchValue) return;

        this.previousSearchValue = trimmedValue;
        this.debouncedSearch();
    }

    preventDefaultArrowKey: KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'ArrowUp') e.preventDefault();
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
                        onKeyDown={this.preventDefaultArrowKey}
                    />
                    {
                        this.state.categorizedSuggestions.length > 0 &&
                        <Suggestions
                            categorizedSuggestions={this.state.categorizedSuggestions}
                            selectedSuggestionUri={this.state.selectedSuggestionUri}
                            onSuggestionClick={this.onSuggestionClick}
                        />
                    }
                </div>
            </div>
        );
    }
}
