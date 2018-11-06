# Templatizer #

Basic templating code, similar to Mustache.js. It originally started very simplistic before requirements basically made it almost the same functional capacity as Mustache.js. On the plus side, it's much lighter, just a little over 100 lines of code. What it doesn't do quite as well as Mustache.js is caching template bindings. So if it's done repeatedly with the same template, Mustache might be faster.

## How to Use ##

Import the source or minified. There is only one function you need to know:

**`Templatizer.render(html, bindings)`** : Renders template.

<table>
  <tbody>
    <tr>
      <th>Name</th><th>Type</th><th>Description</th>
    </tr>
    <tr>
      <td>html</td><td>String</td><td>The template.</td>
    </tr>
    <tr>
      <td>bindings</td><td>Object</td><td>The object literal of data-bindings.</td>
    </tr>
  </tbody>
</table>

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** (String) The rendered template.

----------

## Variables ##

Parts related to templates to be encased in double curley braces, with dot notation to traverse nested structures. Example below where above the break is the template and below the data-bindings.

&nbsp; *Template:*

    {{name.first}} {{name.last}} is {{age}} years old.

&nbsp; *Data:*

    {
      age: 46, 
      name: {
        first: "Bob", 
        last: "Belcher"
      }
    }

&nbsp; *Outputs:*

    Bob Belcher is 46 years old.

## Sections ##

### Basic Sections ###

Section (must be unique, that is, can't have multiple sections with same name) marked with start at `#`-prefix and end at `/`-prefix like so: 

&nbsp; *Template:*

    {{#job}}Is employed{{/job}}

&nbsp; *Data:*

    {job: true}

&nbsp; *Outputs:*

    Is employed

Alternatively, the above would produce no output if the `job` data-binding was to evaluate to `false`.

You may also do an inverse section by replacing `#` starting prefix with `^`. Such sections will only be displayed if the section is evaluated to `false`.

&nbsp; *Template:*

    {{^job}}Is unemployed{{/job}}

&nbsp; *Data:*

    {job: false}

&nbsp; *Outputs:*

    Is unemployed

### Section value evaluation ###

Section value is evaluated as `false` if it is `undefined`, `null`, `false`, an empty string, or a string composed only of whitespace (if you want to add whitespace, use `&nbsp;`). Conversely, a value of `0` is evaluated as `true`.

### Sections with data ###

As long as data-binding for section evaluates to `true` (see above on section value evaluation), it will be treated as such. You may use this as a shortcut for both displaying the section and formatting its value:

&nbsp; *Template:*

    {{#job}}Occupation: {{job}}{{/job}}

&nbsp; *Data:*

    {job: "Chef"}

&nbsp; *Outputs:*

    Occupation: Chef

The above though is somewhat messy of an implementation. One alternative is to separate a "display" variable like so:

&nbsp; *Template:*

    {{#showJob}}Occupation: {{job}}{{/showJob}}

&nbsp; *Data:*

    {
      showJob: true, 
      job: "Chef"
    }

Or, even better, used a nested structure for the section like below:

&nbsp; *Template:*

    {{#job}}Occupation: {{job.title}}{/job}}
 
&nbsp; *Data:*

    {
      job: {title: "Chef"}
    }

Note that section data (excluding repeating sections) are scoped for the entire template. E.g., give the above example, `{{job.title}}` may be used anywhere in the template inside or outside of the section and will be replaced with `Chef` when rendered.

### More section behavior ###

Section data may still be filled out but removed if `_display` variable exists and evaluates to  `false`. E.g. the previous templates would have the section removed, given the data binding of:

&nbsp; *Data:*

    {
      job: {
        title: "Chef", 
        _display: false
      }
    }

Section data used this way is still scoped for entire template. E.g., the above data-binding will still display on the below template, even in a different section. It will also still display even if though `job._display == false` because it is not used within a `job` section, as long as nothing is removing the `occupation` section for the below example.

&nbsp; *Template:*

    {{#occupation}}Occupation: {{job.title}}{{/occupation}}

## Repeating Sections ##

For repeating sections, set value to an array of objects, and section html will be repeated. May still use `_display` to not use particular array item. Values within any array item are limited in scope only to that section given that array item.

&nbsp; *Template:*

    {{#children}}Child: {{children.firstName}}<br />{{/children}}

&nbsp; *Data:*

    {
      children: [
        {firstName: "Tina"}, 
        {firstName: "Gene"}, 
        {firstName: "Louise"}
      ]
    }

&nbsp; *Outputs:*

    Child: Tina
    Child: Gene
    Child: Louise

## Nested Sections ##

Nested sections should behave properly, even mixing regular versus repeating sections, as long as you properly manage the scope. E.g., given the template below: 

&nbsp; *Template:*

    {{#children}}
      {{#children.lastChild}}and {{/children.lastChild}}
      {{children.firstName}} {{name.last}}
      {{^children.lastChild}}, {{/children.lastChild}}
    {{/children}}

&nbsp; *Data:*

    {
      name: {first: "Bob", last: "Belcher"}, 
      children: [
        {firstName: "Tina", lastChild: false}, 
        {firstName: "Gene", lastChild: false}, 
        {firstName: "Louise", lastChild: true}
      ]
    }

&nbsp; *Outputs:*

    Tina Belcher, Gene Belcher, and Louise Belcher.

A few behaviors to note for the above example:

* Within the template for the repeating section, scope is still from the top level, hence we can render `name.last` within, and subvariables of `children` must be called via dot notation.
* `children[].lastChild` must be specified as `false` for all array items, as the evaluation for `lastChild` will only happen where such a key exists.

## Functions ##

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object, however the scope is limited to where it is called.

&nbsp; *Template:*

    {{name.first}} {{name.last}} has {{numChildrenText}}.

&nbsp; *Data:*

    {
      name: {first: "Bob", last: "Belcher"}, 
      numChildrenText: function() {
        switch(this.children.length) {
          case 0:
            return "no children"
          case 1:
            return "one child: "
          default:
            return this.children.length + " children: "
        }
      }, 
      children: [
        {firstName: "Tina"}, 
        {firstName: "Gene"}, 
        {firstName: "Louise"}
      ]
    }

&nbsp; *Outputs:*

    Bob Belcher has 3 children.

Functions fail silently, thus is an error occurs during function call, value is assumed to be empty string. To change this, simply the flag as done below: 

    Templatize.errorOnFuncFailure = true;

## Putting it all together ##

Below is a complex example using a bit of everything covered above.

&nbsp; *Template:*

    {{name.fullName}} has {{numChildrenText}}
    {{#children}}
      {{#children.lastChild}}and {{/children.lastChild}}
      {{children.firstName}} {{name.last}} ({{children.age}})
      {{^children.lastChild}}, {{/children.lastChild}}
    {{/children}}.

&nbsp; *Data:*

    {
      name: {
        first: "Bob", 
        last: "Belcher", 
        fullName: function(parent) {
          return this.first + " " + parent.name.last;          
        }
      }, 
      numChildrenText: function() {
        switch(this.children.length) {
          case 0:
            return "no children"
          case 1:
            return "one child: "
          default:
            return this.children.length + " children: "
        }
      }, 
      thisYear: 2018, 
      children: [
        {
          firstName: "Tina", 
          born: 2005, 
          age: function(parent) { return parent.thisYear - this.born; }, 
          lastChild: false
        }, 
        {
          firstName: "Gene", 
          born: 2007, 
          age: function(parent) { return parent.thisYear - this.born; }, 
          lastChild: false
        }, 
        {
          firstName: "Louise", 
          born: 2009, 
          age: function(parent) { return parent.childAge(this); }, 
          lastChild: true
        }
      ], 
      childAge: function(childObj) { return this.thisYear - childObj.born; }
    }

&nbsp; *Outputs:*

    Bob Belcher has 3 children: Tina Belcher (13), Gene Belcher (11), and Louise Belcher (9).

Note that `numChildren` is scoped in the context of the complete data binding, `name.fullName` is scoped within `name`, and `children[].age` are scoped within the individual array items of `children`. However, the functions are called with a `parent` argument allowing access of higher-level scope.

Finally note for the last child, a unique way of changing scope, which may end up being a cleaner way to avoid repeating a longer and more complex function.