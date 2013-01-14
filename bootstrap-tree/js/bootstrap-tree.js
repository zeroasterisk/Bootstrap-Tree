/* =============================================================
 * bootstrap-tree.js v0.3
 * http://twitter.github.com/cutterbl/Bootstrap-Tree
 *
 * Inspired by Twitter Bootstrap, with credit to bits of code
 * from all over.
 * =============================================================
 * Copyright 2012 Cutters Crossing.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

!function ($) {

  "use strict";

  /* TREE CLASS DEFINITION
   * ========================= */

  var Tree = function (element, options) {

    this.$element = $(element);
    this.$tree = this.$element.closest(".tree");
    this.parentage = GetParentage(this.$element);
    this.options = $.extend({}, $.fn.tree.defaults, options);

    if (this.options.parent) {
      this.$parent = $(this.options.parent);
    }

    this.options.toggle && this.toggle();
  }

  Tree.prototype = {

    constructor: Tree,

    toggle: function () {
      var a, n, s,
          currentStatus = this.$element.hasClass("in"),
          eventName = (!currentStatus) ? "openbranch" : "closebranch";

      this.$parent[currentStatus ? "addClass" : "removeClass"]("closed");
      this.$element[currentStatus ? "removeClass" : "addClass"]("in");

      n = this.node();
      // 'Action' (open|close) event
      a = $.Event(eventName, {
        node: n
      });
      // 'Select' event
      s = $.Event("nodeselect", {
        node: n
      });

      this.$parent.trigger(a).trigger(s);
    },
    _buildOutput: function (doc, type, parent) {
      var nodes = this._buildNodes(doc, type);
      parent.empty().append(this._createNodes(nodes));
    },
    _createNodes: function (nodes) {

      var els = [],
          $this = $(this);

      $.each(nodes, function (ind, el) {
        var node = $("<li>"),
          role = (el.leaf) ? "leaf" : "branch",
          attributes = {},
          anchor = $("<a>");

        attributes.role = role;

        if (!el.leaf) {
          var branch = $("<ul>").addClass("branch");
          attributes.class = "tree-toggle closed";
          attributes["data-toggle"] = "branch";
        }

        if (el.value) attributes["data-value"] = el.value;
        if (el.id) attributes["data-itemid"] = el.id;

        for (var key in el) { // do we have some extras?
          if (key.indexOf("data-") !== -1) attributes[key] = el[key];
        }

        // trade the anchor for a span tag, if it's a leaf
        // and there's no href
        if (el.leaf) {
          anchor = $("<span>");
        } else {
          attributes.href = "#";
        }

        anchor.attr(attributes);

        if (el.cls) anchor.addClass(el.cls);
        if (!el.leaf && el.expanded && el.children.length) {
          anchor.removeClass("closed");
          branch.addClass("in");
        }

        anchor.html(el.text);
        node.append(anchor);

        if (!el.leaf && el.children && el.children.length) {
          branch.append($this[0]._createNodes(el.children));
          node.append(branch);
        }

        els.push(node);
      });

      return els;
    },
    _buildNodes: function (doc, type) {
      var nodes = []
        , $el = this.$element;

      if (type === "json") {
        nodes = this._parseJsonNodes(doc);
      } else if (type === "xml") {
        nodes = this._parseXmlNodes($(doc).find("nodes").children());
      }
      return nodes;
    },
    _parseJsonNodes: function (doc) {
      var nodes = [],
          $this = $(this);

      $.each(doc, function (ind, el) {
        var opts = {},
            boolChkArr = ["leaf","expanded","checkable","checked"];

        for (var item in el) {
          var nodeVal = (item !== "children") ? el[item] : $this[0]._parseJsonNodes(el.children);
          if (!$.isArray(nodeVal)) nodeVal = $.trim(nodeVal);
          if (nodeVal.length) opts[item] = ($.inArray(item, boolChkArr) > -1) ? SetBoolean(nodeVal) : nodeVal;
        }

        nodes.push(new Node(opts));
      });

      return nodes;
    },
    _parseXmlNodes: function (doc) {
      var nodes = [],
        $this = $(this),
        boolChkArr = ["leaf","expanded","checkable","checked"];

      $.each(doc, function (ind, el) {

        var opts = {},
            $el = $(el);

        $.each($el.children(), function (x, i) {

          var $i = $(i),
              tagName = $i[0].nodeName,
              nodeVal = (tagName !== "children") ? $i.text() : $this[0]._parseXmlNodes($i.children("node"));

          if (!$.isArray(nodeVal)) nodeVal = $.trim(nodeVal);
          if (nodeVal.length) opts[tagName] = ($.inArray(tagName, boolChkArr) > -1) ? SetBoolean(nodeVal) : nodeVal;
        });
        nodes.push(new Node(opts));
      });
      return nodes;
    },
    getparentage: function () {
      return this.parentage;
    },
    node: function (el) {
      el = el || $(this);

      var node = $.extend(true, {}, (el[0] === $(this)[0]) ? $(this.$parent).data() : el.data());

      node.branch = this.$element;
      node.parentage = this.parentage;
      node.el = (el[0] === $(this)[0]) ? this.$parent : el;

      delete node.parent;

      return node;
    }
  }

  var Node = function (options) {
    $.extend(true, this, {
      text: undefined,
      leaf: false,
      value: undefined,
      expanded: false,
      cls: undefined,
      id: undefined,
      href: undefined,
      checkable: false,
      checked: false,
      children: []
    }, options);
  }

  var GetParentBranch = function ($this) {
    return $this.closest("ul.branch").prev(".tree-toggle");
  }

  var GetParentage = function ($this) {

    var arr = [], tmp;

    tmp = GetParentBranch($this);
    if (tmp.length) {
      arr = GetParentage(tmp);
      arr.push(tmp.attr("data-value")||tmp.text());
    }

    return arr;
  }

  /**
   * FUNCTION SetBoolean
   *
   * Takes any value, and returns it's boolean equivalent.
   *
   * @param value (any)
   * @return (boolean)
   */
  var SetBoolean = function (value) {

    value = $.trim(value);

    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && !isNaN(value)) value = parseFloat(value);
    if (typeof value === "string") {
      switch (value.toLowerCase()) {
        case "true":
        case "yes":
          return true;
        case "false":
        case "no":
          return false;
      }
    }

    return Boolean(value);
  }


  /* COLLAPSIBLE PLUGIN DEFINITION
   * ============================== */

  $.fn.tree = function (option) {
    return this.each(function () {
      var $this = $(this),
          data = $this.data("tree"),
          options = typeof option == "object" && option

      if (!data) $this.data("tree", (data = new Tree(this, options)))
      if (typeof option == "string") data[option]()
    });
  };

  $.fn.tree.defaults = {
    toggle: true
  };

  $.fn.tree.Constructor = Tree;

  /* COLLAPSIBLE DATA-API
   * ==================== */

  $(function () {

    $("body").on("click.tree.data-api", "[data-toggle=branch]", function (e) {

      e.preventDefault();

      var $this = $(this),
          target = $this.next(".branch"),
          option = $(target).data("tree") ? "toggle" : $this.data();

      option.parent = $this;
      option.href = undefined;

      $(target).tree(option);

      return false;
    })

    $("body").on("click.tree.data-api", "[role=leaf]", function (e) {

      var $this = $(this),
          branch = $this.closest(".branch");

      // If not initialized, then create it
      if (!$(branch).data("tree")) {

        var $target = $(branch),
            branchlink = $target.prev("[data-toggle=branch]"),
            branchdata = branchlink.data();

        $target.tree($.extend({}, branchdata, {
          "toggle": false,
          "parent": branchlink
        }));
      }

      e = $.Event("nodeselect", {
        node: $(branch).data("tree").node($this)
      });

      $this.trigger(e);
    });
  });

}(window.jQuery);