import React from "react";
import firstLetterUpperCase from "../utils/first-letter-upper-case";

import SuggestionItem from "./SuggestionItem";
import type { ICategorizedSuggestion } from "../types/suggestions.model";
import type { SuggestionClickEmitEvent } from "../types/custom-events.model";

interface ISuggestionsComponentProps {
    categorizedSuggestions: ICategorizedSuggestion[];
    onSuggestionClick: SuggestionClickEmitEvent;
    selectedSuggestionUri: string;
}

export default function Suggestions({ categorizedSuggestions, onSuggestionClick, selectedSuggestionUri }: ISuggestionsComponentProps) {
    return (
        <div id="power-bar-suggestions">
            <div id="suggestions-container">
                { categorizedSuggestions.map(({ type, items }) => (
                    <ul className="suggestions-category">
                        <h5>{ firstLetterUpperCase(type) }</h5>

                        { items.map(item => (
                            <SuggestionItem suggestion={item} selected={item.uri === selectedSuggestionUri} onSuggestionClick={onSuggestionClick} />)
                        ) }
                    </ul>
                )) }
            </div>         
        </div>
    );
}
