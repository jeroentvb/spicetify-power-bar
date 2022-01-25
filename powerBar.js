// @ts-check

// NAME: Power bar
// VERSION: 0.1.0
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

    class PowerBar {
        constructor() {
            const { container, input, suggestions } = this.createPowerBar();
            this.container = container;
            this.input = input;
            this.suggestions = suggestions;
            this.searchWithDebounce = debounce(this.search).bind(this);

            document.body.appendChild(this.container);

            document.addEventListener('keydown', (e) => {
                const activatePowerBar = e.code === 'Space' && e.altKey;
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
                                                        : item.images[0].url
                                                }
                                            }
                                        ),
                                        createElement(
                                            'div',
                                            { classNames: 'suggestioin-item__text' },
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
        }

        deRenderSuggestions() {
            removeChildren(this.suggestions);
            this.suggestions.classList.remove('has-suggestions');
            this.input.classList.remove('has-suggestions');
        }

        /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
        onInput({ target: { value }, code, altKey }) {
            const powerBarKeyCombo = code === 'Space' && altKey;
            if (powerBarKeyCombo) return;

            const trimmedValue = value.trim();

            if (code === 'Escape') {
                if (value) {
                    this.input.value = '';
                    this.deRenderSuggestions();
                } else {
                    this.togglePowerBar();
                }

                return;
            }

            if (!trimmedValue || trimmedValue.length < 2) {
                this.deRenderSuggestions();
                return
            }

            this.searchWithDebounce();
        }

        async search() {
            const query = this.input.value.trim().split(' ').join('+');
            const res = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=3&include_external=audio`);
            
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

            this.renderSuggestions(suggestions);
        }

        /**
         * Normal text
            font-size: 16px;
            font-weight: 400;
            letter-spacing: normal;
            line-height: 24px;
            text-transform: none;
            color: #fff;

         * Secondary text
            font-size: 14px;
            font-weight: 400;
            letter-spacing: normal;
            line-height: 16px;
            text-transform: none;
            color: #b3b3b3;

         * Alt text
            font-size: 12px;
            font-weight: 400;
            letter-spacing: .1em;
            line-height: 16px;
            text-transform: uppercase;
            color: #b3b3b3;
         */

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
                    background-color: var(--spice-player);
                    border-radius: var(--pb-border-radius);
                    border: 1px solid var(--spice-card);
                    box-shadow: rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px;
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
                    background-color: var(--spice-player);
                    padding: 1em;
                    border-radius: var(--pb-border-radius);
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
                }

                .suggestion-item:hover {
                    cursor: pointer;
                }

                .suggestion-item__img {
                    height: 2rem;
                    width: 2rem;
                }

                .suggestioin-item__text {
                    display: flex;
                    flex-direction: column;
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