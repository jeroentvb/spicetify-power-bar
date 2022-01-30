// @ts-check

// NAME: Power bar
// VERSION: 1.0.0~beta-1
// DESCRIPTION: Quick search bar
// AUTHOR: jeroentvb (https://github.com/jeroentvb)

/// <reference path='./spicetify.d.ts' />

/**
 * @typedef { { type: string, items: SuggestionItem[] } } Suggestion
 * @typedef { { height: number, url: string, width: number } } SpotifyImage
 * @typedef { {
 *  album?: {
 *      album_type: string
 *      artists: any[]
 *      available_markets: string[]
 *      external_urls: {spotify: string}
 *      href: string
 *      id: string
 *      images: SpotifyImage[]
 *      name: string
 *      release_date: string
 *      release_date_precision: string
 *      total_tracks: number
 *      type: string
 *      uri: string
 *  }
 *  artists?: {
 *      external_urls: {spotify: string}
 *      href: string
 *      id: string
 *      name: string
 *      type: string
 *      uri: string
 *  }[]
 *  owner?: {
 *      display_name: string
 *      external_urls: {spotify: string}
 *      href: string
 *      id: string
 *      type: string
 *      uri: string
 *  }
 *  images?: SpotifyImage[]
 *  available_markets: any[]
 *  disc_number: number
 *  duration_ms: number
 *  explicit: boolean
 *  external_ids: {isrc: string}
 *  external_urls: {spotify: string}
 *  href: string
 *  id: string
 *  is_local: boolean
 *  name: string
 *  popularity: number
 *  preview_url: string
 *  track_number: number
 *  type: string
 *  uri: string
 * } } SuggestionItem
 * 
 * @typedef { {[key: string]: string} } Attribute
 * @typedef { {[key in HTMLElementEventMap as string]: EventListener} } CreateElementEvent
 */

(function powerBar() {
    const { Platform, Player, Menu, LocalStorage } = Spicetify;
    if (!Platform || !Player || !Menu || !LocalStorage) {
        setTimeout(powerBar, 300);
        return;
    }

    /**
     * @param {(...args) => void} func 
     * @param {number} [wait] 
     * @param {boolean} [immediate]
     * @returns {() => void}
     */
     function debounce(func, wait = 300, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    /**
     * @template { keyof HTMLElementTagNameMap } K
     * @param { K } name
     * @param { { attributes?: Attribute[] | Attribute, classNames?: string[] | string, events?: CreateElementEvent[] | CreateElementEvent } } [props]
     * @param { (HTMLElement | Text)[] | HTMLElement | Text } [children]
     * 
     * @returns { HTMLElementTagNameMap[K] }
     */
    function createElement(name, props, children) {
        const el = document.createElement(name);

        /**
         * @template T
         * @param { T[] | T | undefined } item
         * @returns { T[] }
         */
        function createArrayIfIsNot(item) {
            if (!item) return [];
            return Array.isArray(item) ? item : [item];
        }
        
        createArrayIfIsNot(props?.attributes).forEach(attribute => {
            Object.entries(attribute).forEach(([key, value]) => el.setAttribute(key, value));
        });

        createArrayIfIsNot(props?.classNames).forEach(className => el.classList.add(className));

        createArrayIfIsNot(props?.events).forEach(event => {
            Object.entries(event).forEach(([key, value]) => el.addEventListener(key, value));
        });

        createArrayIfIsNot(children).forEach(child => el.appendChild(child));

        return el;
    }

    /** @param { HTMLElement } el */
    function removeChildren(el) {
        while (el.lastElementChild) {
            el.removeChild(el.lastElementChild);
          }
    }
    
    /**
     * @param {HTMLElement} target 
     * @param {HTMLElement} container
     */
     function scrollIntoViewIfNeeded(target, container) {
        const targetBounds = target.getBoundingClientRect();
        const { top, bottom } = container.getBoundingClientRect();

        if (targetBounds.top < top || targetBounds.bottom > bottom) {
            target.scrollIntoView();
        }
    }

    class PowerBar {
        /** @type { SuggestionItem[] } */
        flattenedSuggestions = []
        /** @type { HTMLCollectionOf<HTMLElement> } */
        suggestionElements
        
        _selectedSuggestionIndex = 0;

        set selectedSuggestionIndex(index) {
            if (index === -1) index = this.suggestionElements.length - 1;
            if (index === this.suggestionElements.length) index = 0;

            this.suggestionElements[this._selectedSuggestionIndex].classList.remove('suggestion-item__active');
            this._selectedSuggestionIndex = index;
            this.suggestionElements[index].classList.add('suggestion-item__active');
            scrollIntoViewIfNeeded(this.suggestionElements[index], this.suggestions);
        }

        get selectedSuggestionIndex() {
            return this._selectedSuggestionIndex;
        }

        constructor() {
            const { container, input, suggestions } = this.createPowerBar();
            this.container = container;
            this.input = input;
            this.suggestions = suggestions;
            this.searchWithDebounce = debounce(this.search).bind(this);

            document.body.appendChild(this.container);

            document.addEventListener('keydown', (e) => {
                const activatePowerBar = e.code === 'Space' && e.ctrlKey;
                if (!activatePowerBar) return;

                e.preventDefault();
                this.togglePowerBar();
            });

            this.addCss();
        }

        /** @returns { { container: HTMLDivElement, input: HTMLInputElement, suggestions: HTMLDivElement } } */
        createPowerBar() {
            const container = createElement(
                'div',
                {
                    attributes: { id: 'power-bar-container' },
                    classNames: 'hidden',
                    events: { click: () => container.classList.add('hidden') }
                }
            )
            const wrapper = createElement(
                'div',
                {
                    attributes: { id: 'power-bar-wrapper' },
                    events: { click: (e) => e.stopPropagation() }
                }
            );
            const input = createElement(
                'input',
                {
                    attributes: {
                        placeholder: 'Search Spotify',
                        type: 'text',
                        id: 'power-bar-search'
                    },
                    // @ts-ignore TODO fix types on events
                    events: { keydown: this.onInput.bind(this) }
                }
            );
            const suggestions = createElement(
                'div',
                { attributes: { id: 'power-bar-suggestions' }}
            );

            wrapper.appendChild(input);
            wrapper.appendChild(suggestions);
            container.appendChild(wrapper);

            return { container, input, suggestions };
        }

        togglePowerBar() {
            const activate = this.container.classList.contains('hidden');
            this.container.classList.toggle('hidden');

            if (activate) {
                this.input.focus();
                this.input.value = '';
            } else {
                this.deRenderSuggestions();
            }
        }

        /** @param {Suggestion[]} suggestions */
        renderSuggestions(suggestions) {
            const suggestionsContainer = createElement(
                'div',
                { attributes: {
                    id: 'suggestions-container',
                    role: 'listbox'
                }},
                suggestions.map(({ type, items }) => {
                    return createElement(
                        'ul',
                        {
                            attributes: { role: 'group' },
                            classNames: 'suggestions-category'
                        },
                        [
                            createElement(
                                'h5',
                                null,
                                document.createTextNode(type.charAt(0).toUpperCase() + type.slice(1))
                            ),
                            ...items.map(item => {
                                const hasInfo = item.type === 'track' || item.type === 'album';
                                return createElement(
                                    'li',
                                    {
                                        attributes: { role: 'option' },
                                        classNames: ['suggestion-item',  ...[hasInfo && 'has-info']],
                                        events: {
                                            click: (e) => {
                                                const href = Spicetify.URI.from(item.uri).toURLPath(true);
                                                Spicetify.Platform.History.push(href);
    
                                                this.togglePowerBar();
                                            }
                                        }
                                    },
                                    [
                                        createElement(
                                            'img',
                                            {
                                                classNames: 'suggestion-item__img',
                                                attributes: {
                                                    src: item.type === 'track'
                                                        ? item.album.images[0].url
                                                        : item.images[0]?.url // TODO add placeholder image
                                                }
                                            }
                                        ),
                                        createElement(
                                            'div',
                                            { classNames: 'suggestion-item__text' },
                                            [
                                                createElement('span', null, document.createTextNode(item.name)),
                                                ...hasInfo ? [createElement('span', null, document.createTextNode(item.artists.map(artist => artist.name).join(', ')))] : []
                                            ]
                                        ),
                                        
                                    ]
                                );
                            }),
                        ]
                    );
                })
            );

            removeChildren(this.suggestions);
            this.suggestions.appendChild(suggestionsContainer);
            this.suggestions.classList.add('has-suggestions');
            this.input.classList.add('has-suggestions');

            // Handle selecting items
            // @ts-ignore GIMME TYPESCRIPT PLZ (getElementsByClassName can be casted, but I don't know how in JSDOC)
            this.suggestionElements = document.getElementsByClassName('suggestion-item');
            this.selectedSuggestionIndex = 0;
        }

        deRenderSuggestions() {
            removeChildren(this.suggestions);
            this.suggestions.classList.remove('has-suggestions');
            this.input.classList.remove('has-suggestions');
        }

        /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
        onInput(event) {
            const { target: { value }, code, ctrlKey } = event;
            const powerBarKeyCombo = code === 'Space' && ctrlKey;
            if (powerBarKeyCombo) return;

            const trimmedValue = value.trim();

            // Clear input or hide power bar when esc is pressed
            if (code === 'Escape') {
                if (value) {
                    this.input.value = '';
                    this.deRenderSuggestions();
                } else {
                    this.togglePowerBar();
                }
                return;
            }

            // Handle arrow keys
            if (code === 'ArrowUp') {
                event.preventDefault();
                this.selectedSuggestionIndex--
                return; 
            }
            if (code === 'ArrowDown') {
                event.preventDefault();
                this.selectedSuggestionIndex++
                return;
            }

            if (code === 'Enter') {
                if (this.flattenedSuggestions) {
                    const suggestion = this.flattenedSuggestions[this.selectedSuggestionIndex];
                    const href = Spicetify.URI.from(suggestion.uri).toURLPath(true);
                    Spicetify.Platform.History.push(href);

                    this.flattenedSuggestions = [];
                    this.togglePowerBar();
                    return;
                }
            }

            if (!trimmedValue || trimmedValue.length < 2) {
                this.deRenderSuggestions();
                return
            }

            this.searchWithDebounce();
        }

        async search() {
            const query = this.input.value.trim().split(' ').join('+');
            const res = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=3&include_external=audio`)
            
            const { suggestions, flattenedSuggestions } = this.parseSuggestions(res);

            this.renderSuggestions(suggestions);
            this.flattenedSuggestions = flattenedSuggestions;
        }

        /** @param { {} } res */
        parseSuggestions(res) {
            /** @type {Suggestion[]} */
            const suggestions = Object.entries(res)
                .filter(([_key, value]) => value.items.length > 0)
                .map(([key, value]) => ({ type: key, items: value.items }))
                .reduce((final, item) => {
                    // TODO surely there's a better way to do this..
                    switch(item.type) {
                        case 'tracks': {
                            final[0] = item;
                            break;
                        }
                        case 'artists': {
                            final[1] = item;
                            break;
                        }
                        case 'albums': {
                            final[2] = item;
                            break;
                        }
                        case 'playlists': {
                            final[3] = item;
                            break;
                        }
                    }

                    return final;
                }, []);
            const flattenedSuggestions = suggestions.flatMap((category) => category.items);

            return { suggestions, flattenedSuggestions };
        }

        addCss() {
            const style = document.createElement('style');
            style.textContent = `
                #power-bar-container {
                    display: flex;
                    justify-content: center;
                    height: 100%;
                    position: absolute;
                    width: 100%;
                    z-index: 100;

                    /* variables */
                    --pb-border-radius: 8px;
                }

                #power-bar-wrapper {
                    max-width: 70rem;
                    background-color: var(--spice-card);
                    border-radius: var(--pb-border-radius);
                    border: 1px solid var(--spice-card);
                    box-shadow: 5px 12px 40px 0px var(--spice-shadow);
                    height: fit-content;
                    margin-top: 10vh;
                }

                #power-bar-search {
                    border: none;
                    width: 700px;
                    font-size: 2em;
                    padding: 8px 16px;
                    color: var(--spice-text);
                    background-color: transparent;
                }

                #power-bar-search.has-suggestions {
                    border-bottom: 1px solid var(--spice-shadow);
                }

                #power-bar-suggestions.has-suggestions {
                    padding: 1em 0 1em 1em;
                    max-height: 70vh;
                    overflow-y: scroll;
                }

                #suggestions-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1em;
                }

                .suggestions-category {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .suggestions-category:not(:last-child) {
                    padding-bottom: 1em;
                    border-bottom: 1px solid var(--spice-shadow);
                }

                .suggestions-category p {
                    font-size: 12px;
                    color: var(--spice-subtext);
                }

                .suggestion-item {
                    color: var(--spice-text);
                    display: flex;
                    gap: 1em;
                    align-items: center;
                    padding: 4px 8px;
                    margin-left: -8px;
                }

                .suggestion-item:hover {
                    cursor: pointer;
                }

                .suggestion-item__img {
                    height: 2rem;
                    width: 2rem;
                }

                .suggestion-item__text {
                    display: flex;
                    flex-direction: column;
                }

                .suggestion-item__active {
                    background-color: var(--spice-button);
                    border-radius: 8px;
                }

                .suggestion-item__active span {
                    color: var(--spice-main) !important;
                }

                .suggestion-item.has-info span:nth-child(1) {
                    font-weight: bold;
                }

                .suggestion-item.has-info span:nth-child(2) {
                    color: var(--spice-subtext);
                    font-size: 14px;
                    margin-top: -4px;
                }

                .hidden {
                    display: none !important;
                }
            `;

            this.container.appendChild(style);
        }
    }

    new PowerBar();
})()
