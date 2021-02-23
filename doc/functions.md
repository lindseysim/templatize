## Functions ##

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object where it resides.

&nbsp; *Template:*

```
{{name}} has {{numChildrenText}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: "Bob", 
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
  children: [
    {firstName: "Tina"}, 
    {firstName: "Gene"}, 
    {firstName: "Louise"}
  ]
}
```

&nbsp; *Outputs:*

```
Bob has 3 children.
```

### Context and parent ###

In the previous example, the function `numChildrenText` was called with a `this` context of the data object at the same level in which the function exists, allowing it to access the var `children`. For nested, variables, `this` will also include a `_parent` to allow traversal up the data structure.

&nbsp; *Template:*

```
The head of the family is {{head.name}}, who is married to {{relations.wife.name}}.
```

&nbsp; *Bindings:*

```javascript
{
  familyName: "Belcher", 
  head: {
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
The head of the family is Bob Belcher, who is married to Linda Belcher.
```

Note in the more deeply-nested case, `this._parent` is used twice to traverse upwards two levels.

### Nesting ###

Additionally, the return value of the function may also be another object, array, or function, and treated as appropriate.

&nbsp; *Template:*

```
Bob's kids are {{&kidsNames}}<br />
Louise is {{kidsAges.Louise}} years old
```

&nbsp; *Bindings:*

```javascript
{
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ], 
  kidsNames: function() {
    // this returns an array that we'll treat as a list
    return this.children.map(child => child.name);
  }, 
  kidsAges: function() {
    // this returns an object that we can nest into
    var ages = {};
    this.children.forEach(child => {
      ages[child.name] = 2021 - child.born;
    });
    return ages;
  }
}
```

&nbsp; *Outputs:*

```
Bob's kids are Tina, Gene, and Louise
Louise is 9 years old
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