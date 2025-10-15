#!/bin/sh

echo "Novelweave state is being reset.  This probably doesn't work while VS Code is running."

# Reset the secrets:
sqlite3 ~/Library/Application\ Support/Code/User/globalStorage/state.vscdb \
"DELETE FROM ItemTable WHERE \
    key = 'novelweave.novelweave' OR \
    key LIKE 'workbench.view.extension.novelweave%' OR \
    key LIKE 'secret://{\"extensionId\":\"novelweave.novelweave\",%';"

# delete all novelweave state files:
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/novelweave.novelweave/

# clear some of the vscode cache that I've observed contains novelweave related entries:
rm -f ~/Library/Application\ Support/Code/CachedProfilesData/__default__profile__/extensions.user.cache
