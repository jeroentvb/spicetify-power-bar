import React from "react";
import classnames from "classnames";

import type { ISuggestion } from "../types/suggestions.model";
import type { SuggestionClickEmitEvent } from "../types/custom-events.model";

interface ISuggestionComponentProps {
    suggestion: ISuggestion;
    onSuggestionClick: SuggestionClickEmitEvent;
    selected: boolean;
}

export default function SuggestionItem({ suggestion, onSuggestionClick, selected }: ISuggestionComponentProps) {
    const hasInfo = suggestion.type === 'track' || suggestion.type === 'album';
    const imgSrc = suggestion.type === 'track'
        ? suggestion.album?.images[0].url
        : suggestion.images?.[0]?.url // TODO add placeholder image

    return (
        <li
            className={classnames('suggestion-item', { 'has-info': hasInfo, 'suggestion-item__active': selected })}
            onClick={() => onSuggestionClick(suggestion.uri)}
        >
            <img src={imgSrc} alt={suggestion.name} className="suggestion-item__img" />
            <div className="suggestion-item__text">
                <span>{suggestion.name}</span>
                {hasInfo && <span>{ suggestion.artists?.map(artist => artist.name).join(', ') }</span>}
            </div>
        </li>
    )
}