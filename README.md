# rvlvvr-client

## Setup

### Important note

Before sending pull requests that aren't core fixes to the GPG portion or improvements on existing user interface-related CSS/JS, please talk to Justin or myself. If in doubt, file an issue before sending a pull request so a discussion can be had.

The user interface is mainly a scaffold/starting point and not meant for custom integrations of look and feel - you can freely do this on your own fork and even publish some sort of theme if you wish.

### Install GPG

For OSX

    brew uninstall gpg-agent
    brew uninstall pinentry
    brew install gnupg2

For Linux

    sudo apt-get install gnupg2

### Install keybase

    npm install -g keybase-installer
    keybase-installer
    keybase login
    keybase pull

### Tracking users on keybase

If you change your keys or the person you are tracking changes their keys, you will have to re-track each other. Anytime you track someone on the keybase.io website, you will have to run `keybase pull` to update locally and restart the server.

### If there is a password on your GPG secret ...

For OSX

Install https://gpgtools.org

For Linux

This prompts and remembers the changes. If you don't get this, please send a pull request to this file with changes.

For Windows

Install http://gpg4win.org

(I don't know the rest or if it is required so somebody send a pull request please and thank you!)

## GPG troubleshooting

If for some reason you are getting an error on your client server about 'no secret key' while trying to encrypt a message for a user, it might be that they are not using their keybase key but a different GPG one to encrypt a message. In that case they need to set the default to the keybase one. In OSX this can be set in GPG Preferences (search in spotlight). For Linux you can set that with gpg2:

    gpg2 --default-key <public key fingerprint from keybase.io>

### Then set up the local server:

    npm install
    cp local.json-dist local.json

Change the `me` field in local.json to your username on keybase (not email).

If you are unsure about always trusting the public keys from Keybase's API, then change `alwaysTrust` to false. This means you will have to individually set the trust level for each key.

## Start the server

    npm start

## Final note

Since this is in constant development, expect changes to happen on a daily basis. `git pull` often to keep up to date.
