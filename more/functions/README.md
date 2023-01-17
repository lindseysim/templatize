## Functions

Functions are evaluated and uses the returned value as the data-binding to the specified tag. As the behavior of the function depends on what is returned, it may be used in a variety of contexts, such as using the function output as a section or list.

The function is called within the context of the data-binding object where it resides (accessed via `this`) and given the argument of the full/root data-binding object.

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

Note, since none of the tags were called in context, for the functions called, `this` and `root` will refer to the same (the root data-binding).

&nbsp; 

### Error handling

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply set the `errorOnFuncFailure` flag to true in the [options](../../#options).

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

Functions outputs are cached after their first evaluation. As such, calling `menu` repeatedly will not result in wasted processing calling the `menu` function. This is covered later in the section [function evaluation and caching](#function-evaluation-and-caching).

&nbsp;

### Passing context to functions

To specify a specific context in which the function should be called, you may use the pass-context-to-function directive, by separating the context (first) and function to call it on (second) with an arrow directive (`->`).

When in a passed context, the `this` context for the function will the be the data-binding of the context, but the root will also be supplied as an argument.

An inclusive section can be immediately paired with the pass-context-to-function directive (`#->`), which uses the rendered template within the defined section as the `this` context of the function. As it is treated like a template in the section, it must be paired to a closing section tag with the same function name (though the pass-context-to-function directive is not required on the closing tag).

&nbsp; *Template:*

```
{{#->bold}}{{main->fullname}}'s{{/bold}} kids are:<br />
{{#children}}
  {{#->bold}}{{children->fullname}}{{/bold}} ({{children->age}} years old)<br />
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
    {name: "Tina", born: 2010}, 
    {name: "Gene", born: 2012}, 
    {name: "Louise", born: 2014}
  ], 
  fullname: function(root) {
    return this.name + " " + root.familyName;
  },
  year: 2023, 
  age: function(root) {
    return root.year - this.born;
  },
  bold: function(root) {
    return "<strong>"+this+"</strong>";
  }
}
```

&nbsp; *Outputs:*

<pre>
<strong>Bob Belcher's</strong> kids are:
<strong>Tina Belcher</strong> (13 years old)
<strong>Gene Belcher</strong> (11 years old)
<strong>Louise Belcher</strong> (9 years old)
</pre>

&nbsp;

### Function evaluation and caching

As demonstrated earlier, functions can return almost anything and be appropriately handled from there. However, functions that return a function will continue to be re-evaluated until it returns a non-function value. Or it will error if it begins to detect an infinite recursion (the max. number of recursions or overflow limit is set to 99).

Functions are evaluated when they are first called (or never if they are not). After the first call however, the returned value from the first evaluation is cached. If the function is passed to a context however, it is considered dynamic and re-evaluated each time (even if the same context). In such a way, this is a shortcut to bypass caching even if the passed context is not used.

&nbsp; *Template:*

```
{{   count}}-{{i}}<br />
{{.->count}}-{{i}}<br />
{{   count}}-{{i}}<br />
{{.->count}}-{{i}}
```

&nbsp; *Bindings:*

```javascript
{
  i: 0, 
  count: root => ++root.i
}
```

&nbsp; *Outputs:*

```
1-1
2-1
1-1
3-1
```

Note in the above, any call to `{{count}}` will render "1" as that was value returned at first render. However, by passing a context, we can force the function to re-evaluate, which is what is done on every other line. That said, calling `{{count}}` again after these context calls will still return the cached value of "1". 

Additionally the value of `i` is not evaluated until it is first called (when it equals "1" since the function `count` has been called once and incremented `i`), but after that point, all tags referencing `i` use the now cached value ("1"), even when future evaluations of `count` modify `i`.

**In general, it is highly discouraged for functions to modify the data binding or return different results depending on number of times called** as the results may be quite unintuitive between the caching strategy and rendering optimizations built into Templatize. For an even weirder example, see the documentation on [function evaluation and modifying binding data](../advanced/#function-evaluation-and-modifying-binding-data).

----

&nbsp;

#### More

Functions and the pass-context-to-function directives represent one of the most flexible and powerful use-cases of Templatize (though sometimes the most frustrating to debug). For a run down of some of the advanced uses, edge cases, and particular behaviors, read the section: [advanced usage, edge cases, and general weirdness](../advanced/).
