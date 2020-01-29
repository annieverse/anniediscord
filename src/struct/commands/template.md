
# Here is the default template for creating a new command. (29th January, 2020)

## Simply copy paste this code

```javascript

/*
 *This is only a template, easy to pull from when making a new command
 *
 */
class commandName {

 constructor(Stacks) {
  this.stacks = Stacks
 }

 async execute() {
  const {reply} = this.stacks
  reply(`I am an empty command`)
 }

}

module.exports.help = {
 start: commandName, // The class name
 name:`commandtemplate`, // This MUST equal the filename
 aliases: [], // More or less this is what the user will input on discord to call the command
 description: `No function just a place holder for commands`,
 usage: `TemplateCommand`,
 group: `Admin`,
 public: null,
 require_usermetadata: true,
 multi_user: true
}

```
