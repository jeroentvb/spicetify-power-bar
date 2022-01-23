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
     * @param { keyof HTMLElementTagNameMap } name
     * @param { { attributes?: Attribute[] | Attribute, classNames?: string[] | string, events?: CreateElementEvent[] | CreateElementEvent } } [props]
     * @param { HTMLElement[] | HTMLElement | Text } [children]
     * 
     * @returns { HTMLElement }
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

            document.body.appendChild(this.container);

            document.addEventListener('keydown', ({ code, altKey }) => {
                const activatePowerBar = code === 'Space' && altKey;
                if (!activatePowerBar) return;

                this.togglePowerBar();
            });

            this.addCss();
        }

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
                    events: { keydown: debounce(this.search).bind(this) }
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

        /** @param {KeyboardEvent & { target: HTMLInputElement }} event */
        async search({ target: { value }, code, altKey }) {
            const powerBarKeyCombo = code === 'Space' && altKey;
            if (powerBarKeyCombo) return;

            const query = value.trim().split(' ').join('+');
            const res = await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q=${query}&type=album,artist,playlist,track&limit=3&include_external=audio`);
            
            /** @type {suggestions} */
            const suggestions = Object.entries(res).map(([key, value]) => ({ name: key, items: value.items }));

            this.renderSuggestions(suggestions);
        }

        togglePowerBar() {
            const activate = this.container.classList.contains('hidden');
            this.container.classList.toggle('hidden');

            if (activate) {
                this.input.focus();
            } else {
                console.log('remove');
                removeChildren(this.suggestions);
                this.suggestions.classList.remove('has-suggestions');
            }
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

                #power-bar-search {
                    border: none;
                    border-radius: 8px;
                    width: 700px;
                    font-size: 2em;
                    padding: 8px 16px;
                    color: #000;
                }

                #power-bar~.has-suggestions {
                    border-radius: 8px 8px 0 0;
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