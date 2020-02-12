import collections
import re


error_on_func_failure = False


def render(template, bindings, cleanup):
    rendered = __render(template, bindings)
    if cleanup:
        i_cleanup_start = rendered.find("{{")
        while i_cleanup_start >= 0:
            i_cleanup_end = rendered.find("{{", i_cleanup_start)
            if i_cleanup_end < 0:
                break
            rendered = rendered[0:i_cleanup_end] + rendered[i_cleanup_end+2:]
            i_cleanup_start = rendered.find("{{")


def __render(html, bindings, prefix=None):
    if not html:
        return ""
    in_section = prefix is not None and prefix is not False
    # render section for subsections as nested objects
    if in_section:
        display = not ("_display" not in bindings or bindings["_display"])
        html = __render_section(html, prefix, display)
    # prep prefix for next level
    prefix = "{0}.".format(prefix) if in_section else ""
    for key, value in bindings.iteritems():
        # skip reserved values
        if key == "_display" or key == "_parent":
            continue
        tkey = prefix+key
        if value:
            # if a dictionary, recurse into
            if isinstance(value, dict):
                # add parent context
                if "_parent" not in value:
                    value["_parent"] = bindings
                html = __render(html, value, tkey)
                del value["_parent"]
                continue
            # if a list/tuple/iterable, treat as repeating section
            elif isinstance(value, collections.Sequence) and not isinstance(value, basestring):
                # add parent context
                if "_parent" not in value:
                    value["_parent"] = bindings
                html = __render_list(html, tkey, value)
                html = __render_repeating_section(html, tkey, value)
                del value["_parent"]
                continue
            # if a function, use it to evaluate value
            elif callable(value):
                try:
                    value = value(bindings)
                except Exception as e:
                    global error_on_func_failure
                    if error_on_func_failure:
                        raise e
                    value = ""
        html = __render_section(html, tkey, value)          # check display/hide as section
        html = re.sub(r'{{0\}}'.format(tkey), value, html)  # replace with greedy search
    return html


def __render_section(html, section, display):
    # value that evaluate to false but treated as true is 0, vice versa for whitespace-only string
    display = display == 0 or (display and (not isinstance(display, basestring) or len(display.strip())))
    # section tags
    section_include_start = "{{#" + section + "}}"
    section_exclude_start = "{{^" + section + "}}"
    section_end           = "{{/" + section + "}}"
    # to optimize not searching over parts already passed or when string isn't long enough anyways
    search_from_index = 0
    min_html_length   = len(section_include_start) + len(section_end)
    while True:
        # break length isn't even long enough for section tags to fit or at end of template
        if len(html) < min_html_length or (search_from_index and search_from_index+1 >= len(html)):
            break
        # find first section of either type
        i_include_start = html.find(section_include_start, search_from_index)
        i_exclude_start = html.find(section_exclude_start, search_from_index)
        # determine which type is first
        inclusive = i_include_start >= 0 and (i_exclude_start < 0 or i_include_start > i_exclude_start)
        i_start = i_include_start if inclusive else i_exclude_start
        # if valid, find section end, search from found section start
        i_end = html.find(section_end, i_start) if i_start >= 0 else False
        # break if no [properly-formatted] section found
        if (not i_end and i_end is not 0) or i_end < 0:
            break
        # display if display and inclusive or not-display and exclusive
        if (inclusive if display else not display):
            # simply remove the tags to show section (use non-greedy replace)
            html = (
                html[0:i_start]
                + html[i_start+len(section_end):i_end]
                + html[i_end+len(section_end):]
            )
        else:
            # splice out the sections
            if i_start is 0:
                html = html[i_end+len(section_end):]
            else:
                html = html[0:i_start] + html[i_end+len(section_end):]
            search_from_index = i_start
    return html


def __render_repeating_section(html, section, bindings):
    section_start = "{{#" + section + "}}"
    section_end   = "{{/" + section + "}}"
    i_start       = html.find(section_start)
    i_end         = html.find(section_end, i_start) if i_start >= 0 else False
    # both parts must be found and in correct order
    if i_end is False or i_end <= 0:
        return html
    # slice out section
    section_html = html[i_start+len(section_start):i_end]
    # build html for repeating section
    insert_html = ""
    for child in bindings:
        if "_parent" not in child:
            child["_parent"] = bindings["_parent"]
        # treat each section like a new render
        insert_html += __render(section_html, child, section)
        del child["_parent"]
    # splice into full template, replacing old section template
    if i_start == 0:
        return insert_html + html[i_end+len(section_end):]
    else:
        return html[0:i_start] + insert_html + html[i_end+len(section_end):]


def __render_list(html, section, bindings):
    num = len(bindings)
    list_str = None
    if num == 0:
        list_str = ""
    elif num == 2:
        list_str = "{0} and {1}".format(bindings[0], bindings[1])
    else:
        for i, item in enumerate(bindings):
            if list_str is None:
                list_str = "{0}".format(item)
            elif i+1 == num:
                list_str = ", and {0}".format(item)
            else:
                list_str = ", {0}".format(item)
    html = re.sub(r'{{&0\}}'.format(section), value, html)
