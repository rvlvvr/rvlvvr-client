# rvlvvr-client

## setup

### Install GPG

For OSX

    brew install gnupg2 gpg-agent

For Linux

    sudo apt-get install gnupg2

### Install keybase

    npm install -g keybase-installer
    keybase-installer
    keybase login
    keybase pull

### Tracking users on keybase

If you change your keys or the person you are tracking changes their keys, you will have to re-track each other. Anytime you track someone on the keybase.io website, you will have to run `keybase pull` to update locally.

### If there is a password on your GPG secret ...

For OSX

Follow these instructions http://sudoers.org/2013/11/05/gpg-agent.html

For Linux

This prompts and remembers the changes. If you don't get this, please send a pull request to this file with changes.

### Then set up the local server:

    npm install
    cp local.json-dist local.json

Change the `me` field in local.json to your username on keybase (not email).

    npm start