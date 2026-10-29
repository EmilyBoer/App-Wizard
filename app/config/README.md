# Built-in Claude key for tester copies

To give testers a copy that works without their own Claude key:

1. In Claude Console, create a key named "Margot testers" and set a low monthly spending limit.
2. Create `config/claude.json` in this folder:

   ```json
   { "key": "sk-ant-..." }
   ```

3. Build or share the app as usual. The Claude tab and the "Connect Claude" setup step disappear.

`config/claude.json` is listed in `.gitignore`, so it never goes to GitHub. Anyone with a copy of the app could find the key, so keep the limit low and replace the key if it leaks.
