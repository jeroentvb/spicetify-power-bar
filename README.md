# Spicetify power bar
Spotlight-like quick search bar to navigate to tracks, albums, artists and playlists.

![power bar](docs/power-bar.png)

## Table of contents
  - [Installation](#installation)
  - [Usage](#usage)
  - [Settings](#settings)

## Installation
Install via [spicetify-marketplace](https://github.com/CharlieS1103/spicetify-marketplace)

Or the manual way:  
Copy [power-bar.js](dist/power-bar.js) to the spicetify extenstions folder
| **Platform**    | **Path**                               |
|-----------------|----------------------------------------|
| **MacOs/Linux** | `~/.config/spicetify/Extensions`       |
| **Windows**     | `%userprofile%/.spicetify/Extensions/` |

Run the following commands
```sh
spicetify config extensions power-bar.js
spicetify apply
```

## Usage
Activate using the shortcut. These are defaults. Can be changed in the [settings](#settings).
| **Platform**      | **Shortcut** |
|-------------------|--------------|
| **Windows/Linux** | `ctrl+space` |
| **MacOs**         | `alt+space`  |

In the suggestion list you can jump back and forth between categories by pressing `tab` and `shift+tab`.

## Settings
Settings for the power bar can be found on spotify's settings page. There are settings for the following things:
* **Activation key combo**. Defaults are `alt+space` on MacOs, and `ctrl+space` on other operating systems. Can be changed to anything in to following format: `modifier+key`. A modifier key is one of the following: 
  * Shift
  * Control
  * Alt
  * Cmd/Windows
* **Amount of suggestions per category**. How many suggestions to show per per category. Default is 3. Technically this can be set to 50, but in the power bar it's limited to 10 per category due to it being a better user experience.
* **Play suggestion on click**. Whether or not to play the selected track, album, playlist or artist when clicking on or pressing enter on a suggestion. Default is false.  
When this setting is enabled, holding `ctrl` (windows/linux) or `cmd` (macOs) when selecting an item prevents navigating to it, so it only starts playing.
