## Functions

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object where it resides (and may access the context via `this`) and given the argument of the root data.

As the behavior of the function depends on what is returned, it may be used in a variety of contexts.

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
  fullname: function(root) {
    // in this case, this/root will refer to the same
    return this.name.first + " " + root.name.last;
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

### Error handling

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply set the `errorOnFuncFailure` flag to `true` in the [options](../../#options).

&nbsp; 

### Functions as objects

If a function returns an object, it can be referenced into as if it were a normal object.

&nbsp; *Template:*

```
Menu: <br />
{{menu.burger.name::capitalize}} - {{menu.burger.price::$.2f}}.<br />
{{menu.fries.name::capitalize}} - {{menu.fries.price::$.2f}}.<br />
{{menu.soda.name::capitalize}} - {{menu.soda.price::$.2f}}. 
```

&nbsp; *Bindings:*

```javascript
{ 
  burger: {name: "burger", price: 5}, 
  fries: {name: "fries", price: 2}, 
  soda: {name: "soda", price: 2}, 
  menu: function() {
    return {burger: this.burger, fries: this.fries, soda: this.soda};
  }
}
```

&nbsp; *Outputs:*

```
Menu:
Burger - $5.00.
Fries - $2.00.
Soda - $2.00.
```

&nbsp;

### Passing context to functions

To specify a specific context in which the function should be called, you may use the pass-context-to-function directive, by separating the context (first) and function to call it on (second) with an arrow directive (`->`).

When in a passed context, the `this` context for the function will the be the data-binding of the context, but the root will also be supplied as an argument.

&nbsp; *Template:*

```
{{main->fullname}}'s kids are:<br />
{{#children}}
  {{children->fullname}} ({{children->age}} years old)<br />
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
  fullname: function(root) {
    return this.name + " " + root.familyName;
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

&nbsp;

### Function evaluation and caching

As demonstrated earlier, functions can return almost anything and be appropriately handled from there. However, functions that return a function will continue to be re-evaluated until it returns a non-function value. Or it will error if it begins to detect an infinite loop (the max. iterations is kept quite strict at 12).

Functions are evaluated when they are first called (or never if they are not). After the first call however, the returned value from the first evaluation is cached. If the function is passed to a context however, it is considered dynamic and re-evaluated each time (even if the same context).

&nbsp; *Template:*

```
{{count}}, 
{{.->count}}-{{i}}, 
{{count}}-{{i}}, 
{{.->count}}-{{i}}
```

&nbsp; *Bindings:*

```javascript
{
  i: 0, 
  count: function(root) { return ++root.i; }
}
```

&nbsp; *Outputs:*

```
1, 2-2, 1-2, 3-2
```

Note in the above, any call to `{{count}}` will render "1" as that was value returned at first render. However, by passing a context, we can force the function to re-evaluate, which we do for the repeating section. That said, calling `{{count}}` again after these context calls will still return the cached value. 

Additionally the value of `i` render dynamically when it is first called (where it equals "2" since the function `count` has been evaluated twice), but after that point, all tags referencing `i` use the cached value of "2" as well, despite the fact that function is actively modifying the value since.

**In general, it is highly discouraged for functions to modify the data binding or return different results depending on number of times called** as the results may be quite unintuitive between the caching strategy and rendering optimizations built into Templatize. For an even weirder example, see the documentation on [function evaluation and modifying binding data](../advanced/#function-evaluation-and-modifying-binding-data).

----

&nbsp;

#### More

Functions and the pass-context-to-function directives represent one of the most flexible and powerful use-cases of Templatize (though sometimes the most frustrating to debug). For a run down of some of the advanced uses, edge cases, and particular behaviors, read the section: [advanced usage, edge cases, and general weirdness](../advanced/).
