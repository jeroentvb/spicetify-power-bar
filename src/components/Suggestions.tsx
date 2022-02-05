import React from "react";

import SuggestionItem from "./SuggestionItem";
import type { ICategorizedSuggestion } from "../types/suggestions.model";
import type { SuggestionClickEmitEvent } from "../types/custom-events.model";

interface ISuggestionsComponentProps {
    categorizedSuggestions: ICategorizedSuggestion[];
    onSuggestionClick: SuggestionClickEmitEvent;
}

export default function Suggestions({ categorizedSuggestions, onSuggestionClick }: ISuggestionsComponentProps) {
    return (
        <div id="power-bar-suggestions">
            <div id="suggestions-container">
                { categorizedSuggestions.map(({ type, items }) => (
                    <ul className="suggestions-category">
                        <h5>{type.charAt(0).toUpperCase() + type.slice(1)}</h5>

                        { items.map(item => (
                            <SuggestionItem suggestion={item} onSuggestionClick={onSuggestionClick} />)
                        ) }
                    </ul>
                )) }
            </div>
        </div>
    )
}