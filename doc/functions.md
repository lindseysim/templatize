## Functions

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object where it resides (and may access the context via `this`).

As the behavior of the function depends on what is returned, it may be used in a variety of contexts. Note however that functions that return a function will continue to be re-evaluated until it returns a non-function value or will error if it exceeds a maximum number of iterations without doing such.

&nbsp; *Template:*

```
{{fullname}}'s friends include {{&friends}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher"
  }, 
  fullname: function() {
    return this.name.first + " " + this.name.last;
  }, 
  relations: [
    {name: "Teddy", friendly: true}, 
    {name: "Mort", friendly: true}, 
    {name: "Jimmy Pesto", friendly: false}
  ], 
  friends: function() { 
    return this.relations.filter(person => person.friendly)
                         .map(person => person.name);
  }
}
```

&nbsp; *Outputs:*

```
Bob Belcher's friends include Teddy and Mort.
```

&nbsp;

### Context and `_parent`

In the previous example, the functions were all at the root level, and thus the `this` context was the root data binding. For nested, variables, `this` will also include a `_parent` to allow traversal up the data structure.

&nbsp; *Template:*

```
{{main.name}} is married to {{relations.wife.name}}.
```

&nbsp; *Bindings:*

```javascript
{
  familyName: "Belcher", 
  main: {
    firstName: "Bob", 
    name: function() { return this.firstName + " " + this._parent.familyName }
  }, 
  relations: {
    wife: {
      firstName: "Linda", 
      name: function() { return this.firstName + " " + this._parent._parent.familyName }
    }
  }
}
```

&nbsp; *Outputs:*

```
Bob Belcher is married to Linda Belcher.
```

Note in the more deeply-nested case, `this._parent` can be used twice to traverse upwards two levels.

&nbsp;

### Passing context to function

To specify a specific context in which the function should be called, you may use the pass-context-to-function directive, by separating the context (first) and function to call it on (second) with a tilde (`~`).

&nbsp; *Template:*

```
{{main~fullname}}'s kids are:<br />
{{#children}}
  {{children~fullname}} ({{.~age}} years old)<br />
{{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  main: {
    name: "Bob"
  }, 
  familyName: "Belcher", 
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ], 
  fullname: function() {
    return this.name + " " + this._parent.familyName;
  },
  age: function() {
    return 2021 - this.born;
  }
}
```

&nbsp; *Outputs:*

```
Bob Belcher's kids are:
Tina Belcher (13 years old)
Gene Belcher (11 years old)
Louise Belcher (9 years old)
```

### Functions within functions ###

Finally, there is the special case of calling a function within a function. While this is easily done using the `this` context, all inner functions that are manually triggered require careful monitoring of the context as nested function calls get triggered. For a detailed explanation and example of how this works, see [Scoping of functions within functions](#scoping-of-function-within-functions).

### Dynamically scoping functions ###

You may want set the context of the functions dynamically, for example, within a repeating section. By calling a function with the tilde (`~`), the function will be called with the context as specified before the tilde.

&nbsp; *Template:*

```
{{#family.children}}{{family.children.name}} is {{family.children~calcAge}}. {{/family.children}}
```

&nbsp; *Bindings:*

```javascript
{
  family: {
    children: [
      {name: "Tina", born: 2008}, 
      {name: "Gene", born: 2010}, 
      {name: "Louise", born: 2012}
    ]
  }, 
  calcAge: function() {
    return 2021 - this.born;
  }
}
```

&nbsp; *Outputs:*

```
Bob is 47.
```

### Error handling ###

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply set the `errorOnFuncFailure` flag to `true`: 

```javascript
Templatize.errorOnFuncFailure = true;
```

Depending on your dependency manager, this may or may not affect all references to `Templatize`. Generally speaking, assume `Templatize` is a static reference, so either adjust for all uses, and/or have it reset back to a desired behavior after using it with non-default behavior.

&nbsp; 

## Putting it all together ##

Below is a complex example using a bit of everything covered above.

&nbsp; *Template:*

```
{{name~fullname}} has {{numChildrenText}}.<br />
{{&kidsNamesAndAges}}.
<br /><br />
{{#relations}}His {{relations.relation}} is {{relations.fullname}}. {{/relations}}
```

&nbsp; *Bindings:*

```javascript
{
  familyName: "Belcher", 
  name: {
    first: "Bob", 
    full: function() {
      return this.first + " " + this._parent.familyName;          
    }
  }, 
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ],  
  numChildrenText: function() {
    switch(this.children.length) {
      case 0:
        return "no children"
      case 1:
        return "one child"
      default:
        return this.children.length + " children"
    }
  }, 
  year: 2021, 
  kidsNamesAndAges: function() {
    return this.children.map(child => {
      child._parent = this;  // helper functions being manually called need '_parent'
      var fullname = this['~fullname'].call(child), 
          age = this.year - child.born;
      return fullname + " is " + age + " years old";
    });
  }, 
  relations: [
    {
      relation: "wife", 
      name: "Linda", 
      fullname: function() { return this._parent['~fullname'].call(this); }
    }, 
    {
      relation: "rival", 
      fullname: "Jimmy Pesto"
    }
  ], 
  '~fullname': function() {
    return (this.first || this.name) + " " + this._parent.familyName;
  },
}
```

&nbsp; *Outputs:*

```
Bob Belcher has 3 children. 
Tina Belcher is 13 years old, Gene Belcher is 11 years old, and Louise Belcher is 9 years old.

His wife is Linda Belcher. His rival is Jimmy Pesto.
```