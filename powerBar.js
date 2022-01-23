// @ts-check

// NAME: Power bar
// VERSION: 0.1.0
// DESCRIPTION: Quick search bar
// AUTHOR: jeroentvb (https://github.com/jeroentvb)

/// <reference path='./spicetify.d.ts' />

/**
 * @typedef { { name: string, items: object[] }[] } suggestions
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
     * @param { HTMLElement[] | HTMLElement | Text } [children]
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

        /** @param {suggestions} suggestions */
        renderSuggestions(suggestions) {
            const suggestionsContainer = createElement(
                'div',
                { attributes: { id: 'suggestions-container' }},
                suggestions.map(({ name, items }) => {
                    return createElement(
                        'div',
                        { classNames: 'suggestions-category' },
                        [
                            createElement(
                                'h3',
                                null,
                                document.createTextNode(name.charAt(0).toUpperCase() + name.slice(1))
                            ),
                            ...items.map(item => createElement(
                                'a',
                                {
                                    classNames: 'suggestion-item',
                                    events: {
                                        click: (e) => {
                                            const href = Spicetify.URI.from(item.uri).toURLPath(true);
                                            Spicetify.Platform.History.push(href);

                                            this.togglePowerBar();
                                        }
                                    }
                                },
                                document.createTextNode(item.name)
                            )),
                        ]
                    );
                })
            );

            removeChildren(this.suggestions);
            this.suggestions.appendChild(suggestionsContainer);
            this.suggestions.classList.add('has-suggestions');
        }

        deRenderSuggestions() {
            removeChildren(this.suggestions);
            this.suggestions.classList.remove('has-suggestions');
        }

        /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
        onInput({ target: { value }, code, altKey }) {
            const powerBarKeyCombo = code === 'Space' && altKey;
            if (powerBarKeyCombo) return;

            if (code === 'Escape') {
                this.togglePowerBar();
            }

            const trimmedValue = value.trim();
            if ( !trimmedValue || trimmedValue.length < 2) {
                this.deRenderSuggestions();
                return
            }

            this.searchWithDebounce();
        }

        async search() {
            const query = this.input.value.trim().split(' ').join('+');
            const res = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=3&include_external=audio`)
            
            /** @type {suggestions} */
            const suggestions = Object.entries(res)
                .filter(([_key, value]) => value.items.length > 0)
                .map(([key, value]) => ({ name: key, items: value.items }));

            this.renderSuggestions(suggestions);
        }

        addCss() {
            const style = document.createElement('style');
            style.textContent = `
                #power-bar-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    position: absolute;
                    width: 100%;
                }

                #power-bar-wrapper {
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px;
                }

                #power-bar-search {
                    border: none;
                    width: 700px;
                    font-size: 2em;
                    padding: 8px 16px;
                    color: #000;
                    background-color: transparent;
                }

                #power-bar-suggestions.has-suggestions {
                    background-color: #fff;
                    padding: 1em;
                    border-radius: 0 0 8px 8px;
                    color: #000;
                }

                .suggestions-category:not(:last-child) {
                    margin-bottom: 1em;
                }

                .suggestion-item {
                    color: #000;
                    display: block;
                }

                .suggestion-item:hover {
                    cursor: pointer;
                }

                .hidden {
                    display: none !important;
                }
            `;

            document.body.appendChild(style);
        }
    }

    new PowerBar();
})()