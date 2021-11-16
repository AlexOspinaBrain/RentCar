/**
 * @file
 * JavaScript behaviors for element help text (tooltip).
 */

(function ($, Drupal) {

  'use strict';

  // @see https://atomiks.github.io/tippyjs/v5/all-props/
  // @see https://atomiks.github.io/tippyjs/v6/all-props/
  Drupal.webform = Drupal.webform || {};
  Drupal.webform.elementHelpIcon = Drupal.webform.elementHelpIcon || {};
  Drupal.webform.elementHelpIcon.options = Drupal.webform.elementHelpIcon.options || {};

  /**
   * Element help icon.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformElementHelpIcon = {
    attach: function (context) {
      if (!window.tippy) {
        return;
      }

      $(context).find('.js-webform-element-help').once('webform-element-help').each(function () {
        var $link = $(this);

        $link.on('click', function (event) {
          // Prevent click from toggling <label>s wrapped around help.
          event.preventDefault();
        });

        var options = $.extend({
          content: $link.attr('data-webform-help'),
          delay: 100,
          allowHTML: true,
          interactive: true
        }, Drupal.webform.elementHelpIcon.options);

        tippy(this, options);
      });
    }
  };

})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, debounce) {
  var offsets = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  function getRawOffset(el, edge) {
    var $el = $(el);
    var documentElement = document.documentElement;
    var displacement = 0;
    var horizontal = edge === 'left' || edge === 'right';
    var placement = $el.offset()[horizontal ? 'left' : 'top'];
    placement -= window["scroll".concat(horizontal ? 'X' : 'Y')] || document.documentElement["scroll".concat(horizontal ? 'Left' : 'Top')] || 0;

    switch (edge) {
      case 'top':
        displacement = placement + $el.outerHeight();
        break;

      case 'left':
        displacement = placement + $el.outerWidth();
        break;

      case 'bottom':
        displacement = documentElement.clientHeight - placement;
        break;

      case 'right':
        displacement = documentElement.clientWidth - placement;
        break;

      default:
        displacement = 0;
    }

    return displacement;
  }

  function calculateOffset(edge) {
    var edgeOffset = 0;
    var displacingElements = document.querySelectorAll("[data-offset-".concat(edge, "]"));
    var n = displacingElements.length;

    for (var i = 0; i < n; i++) {
      var el = displacingElements[i];

      if (el.style.display === 'none') {
        continue;
      }

      var displacement = parseInt(el.getAttribute("data-offset-".concat(edge)), 10);

      if (isNaN(displacement)) {
        displacement = getRawOffset(el, edge);
      }

      edgeOffset = Math.max(edgeOffset, displacement);
    }

    return edgeOffset;
  }

  function calculateOffsets() {
    return {
      top: calculateOffset('top'),
      right: calculateOffset('right'),
      bottom: calculateOffset('bottom'),
      left: calculateOffset('left')
    };
  }

  function displace(broadcast) {
    offsets = calculateOffsets();
    Drupal.displace.offsets = offsets;

    if (typeof broadcast === 'undefined' || broadcast) {
      $(document).trigger('drupalViewportOffsetChange', offsets);
    }

    return offsets;
  }

  Drupal.behaviors.drupalDisplace = {
    attach: function attach() {
      if (this.displaceProcessed) {
        return;
      }

      this.displaceProcessed = true;
      $(window).on('resize.drupalDisplace', debounce(displace, 200));
    }
  };
  Drupal.displace = displace;
  $.extend(Drupal.displace, {
    offsets: offsets,
    calculateOffset: calculateOffset
  });
})(jQuery, Drupal, Drupal.debounce);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, displace) {
  function TableHeader(table) {
    var $table = $(table);
    this.$originalTable = $table;
    this.$originalHeader = $table.children('thead');
    this.$originalHeaderCells = this.$originalHeader.find('> tr > th');
    this.displayWeight = null;
    this.$originalTable.addClass('sticky-table');
    this.tableHeight = $table[0].clientHeight;
    this.tableOffset = this.$originalTable.offset();
    this.$originalTable.on('columnschange', {
      tableHeader: this
    }, function (e, display) {
      var tableHeader = e.data.tableHeader;

      if (tableHeader.displayWeight === null || tableHeader.displayWeight !== display) {
        tableHeader.recalculateSticky();
      }

      tableHeader.displayWeight = display;
    });
    this.createSticky();
  }

  function forTables(method, arg) {
    var tables = TableHeader.tables;
    var il = tables.length;

    for (var i = 0; i < il; i++) {
      tables[i][method](arg);
    }
  }

  function tableHeaderInitHandler(e) {
    var $tables = $(e.data.context).find('table.sticky-enabled').once('tableheader');
    var il = $tables.length;

    for (var i = 0; i < il; i++) {
      TableHeader.tables.push(new TableHeader($tables[i]));
    }

    forTables('onScroll');
  }

  Drupal.behaviors.tableHeader = {
    attach: function attach(context) {
      $(window).one('scroll.TableHeaderInit', {
        context: context
      }, tableHeaderInitHandler);
    }
  };

  function scrollValue(position) {
    return document.documentElement[position] || document.body[position];
  }

  function tableHeaderResizeHandler(e) {
    forTables('recalculateSticky');
  }

  function tableHeaderOnScrollHandler(e) {
    forTables('onScroll');
  }

  function tableHeaderOffsetChangeHandler(e, offsets) {
    forTables('stickyPosition', offsets.top);
  }

  $(window).on({
    'resize.TableHeader': tableHeaderResizeHandler,
    'scroll.TableHeader': tableHeaderOnScrollHandler
  });
  $(document).on({
    'columnschange.TableHeader drupalToolbarTrayChange': tableHeaderResizeHandler,
    'drupalViewportOffsetChange.TableHeader': tableHeaderOffsetChangeHandler
  });
  $.extend(TableHeader, {
    tables: []
  });
  $.extend(TableHeader.prototype, {
    minHeight: 100,
    tableOffset: null,
    tableHeight: null,
    stickyVisible: false,
    createSticky: function createSticky() {
      this.$html = $('html');
      var $stickyHeader = this.$originalHeader.clone(true);
      this.$stickyTable = $('<table class="sticky-header"></table>').css({
        visibility: 'hidden',
        position: 'fixed',
        top: '0px'
      }).append($stickyHeader).insertBefore(this.$originalTable);
      this.$stickyHeaderCells = $stickyHeader.find('> tr > th');
      this.recalculateSticky();
    },
    stickyPosition: function stickyPosition(offsetTop, offsetLeft) {
      var css = {};

      if (typeof offsetTop === 'number') {
        css.top = "".concat(offsetTop, "px");
      }

      if (typeof offsetLeft === 'number') {
        css.left = "".concat(this.tableOffset.left - offsetLeft, "px");
      }

      this.$html.css('scroll-padding-top', displace.offsets.top + (this.stickyVisible ? this.$stickyTable.height() : 0));
      return this.$stickyTable.css(css);
    },
    checkStickyVisible: function checkStickyVisible() {
      var scrollTop = scrollValue('scrollTop');
      var tableTop = this.tableOffset.top - displace.offsets.top;
      var tableBottom = tableTop + this.tableHeight;
      var visible = false;

      if (tableTop < scrollTop && scrollTop < tableBottom - this.minHeight) {
        visible = true;
      }

      this.stickyVisible = visible;
      return visible;
    },
    onScroll: function onScroll(e) {
      this.checkStickyVisible();
      this.stickyPosition(null, scrollValue('scrollLeft'));
      this.$stickyTable.css('visibility', this.stickyVisible ? 'visible' : 'hidden');
    },
    recalculateSticky: function recalculateSticky(event) {
      this.tableHeight = this.$originalTable[0].clientHeight;
      displace.offsets.top = displace.calculateOffset('top');
      this.tableOffset = this.$originalTable.offset();
      this.stickyPosition(displace.offsets.top, scrollValue('scrollLeft'));
      var $that = null;
      var $stickyCell = null;
      var display = null;
      var il = this.$originalHeaderCells.length;

      for (var i = 0; i < il; i++) {
        $that = $(this.$originalHeaderCells[i]);
        $stickyCell = this.$stickyHeaderCells.eq($that.index());
        display = $that.css('display');

        if (display !== 'none') {
          $stickyCell.css({
            width: $that.css('width'),
            display: display
          });
        } else {
          $stickyCell.css('display', 'none');
        }
      }

      this.$stickyTable.css('width', this.$originalTable.outerWidth());
    }
  });
  Drupal.TableHeader = TableHeader;
})(jQuery, Drupal, window.Drupal.displace);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, window) {
  function TableResponsive(table) {
    this.table = table;
    this.$table = $(table);
    this.showText = Drupal.t('Show all columns');
    this.hideText = Drupal.t('Hide lower priority columns');
    this.$headers = this.$table.find('th');
    this.$link = $('<button type="button" class="link tableresponsive-toggle"></button>').attr('title', Drupal.t('Show table cells that were hidden to make the table fit within a small screen.')).on('click', $.proxy(this, 'eventhandlerToggleColumns'));
    this.$table.before($('<div class="tableresponsive-toggle-columns"></div>').append(this.$link));
    $(window).on('resize.tableresponsive', $.proxy(this, 'eventhandlerEvaluateColumnVisibility')).trigger('resize.tableresponsive');
  }

  Drupal.behaviors.tableResponsive = {
    attach: function attach(context, settings) {
      var $tables = $(context).find('table.responsive-enabled').once('tableresponsive');

      if ($tables.length) {
        var il = $tables.length;

        for (var i = 0; i < il; i++) {
          TableResponsive.tables.push(new TableResponsive($tables[i]));
        }
      }
    }
  };
  $.extend(TableResponsive, {
    tables: []
  });
  $.extend(TableResponsive.prototype, {
    eventhandlerEvaluateColumnVisibility: function eventhandlerEvaluateColumnVisibility(e) {
      var pegged = parseInt(this.$link.data('pegged'), 10);
      var hiddenLength = this.$headers.filter('.priority-medium:hidden, .priority-low:hidden').length;

      if (hiddenLength > 0) {
        this.$link.show().text(this.showText);
      }

      if (!pegged && hiddenLength === 0) {
        this.$link.hide().text(this.hideText);
      }
    },
    eventhandlerToggleColumns: function eventhandlerToggleColumns(e) {
      e.preventDefault();
      var self = this;
      var $hiddenHeaders = this.$headers.filter('.priority-medium:hidden, .priority-low:hidden');
      this.$revealedCells = this.$revealedCells || $();

      if ($hiddenHeaders.length > 0) {
        $hiddenHeaders.each(function (index, element) {
          var $header = $(this);
          var position = $header.prevAll('th').length;
          self.$table.find('tbody tr').each(function () {
            var $cells = $(this).find('td').eq(position);
            $cells.show();
            self.$revealedCells = $().add(self.$revealedCells).add($cells);
          });
          $header.show();
          self.$revealedCells = $().add(self.$revealedCells).add($header);
        });
        this.$link.text(this.hideText).data('pegged', 1);
      } else {
          this.$revealedCells.hide();
          this.$revealedCells.each(function (index, element) {
            var $cell = $(this);
            var properties = $cell.attr('style').split(';');
            var newProps = [];
            var match = /^display\s*:\s*none$/;

            for (var i = 0; i < properties.length; i++) {
              var prop = properties[i];
              prop.trim();
              var isDisplayNone = match.exec(prop);

              if (isDisplayNone) {
                continue;
              }

              newProps.push(prop);
            }

            $cell.attr('style', newProps.join(';'));
          });
          this.$link.text(this.showText).data('pegged', 0);
          $(window).trigger('resize.tableresponsive');
        }
    }
  });
  Drupal.TableResponsive = TableResponsive;
})(jQuery, Drupal, window);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  var states = {
    postponed: []
  };
  Drupal.states = states;

  function invert(a, invertState) {
    return invertState && typeof a !== 'undefined' ? !a : a;
  }

  function _compare2(a, b) {
    if (a === b) {
      return typeof a === 'undefined' ? a : true;
    }

    return typeof a === 'undefined' || typeof b === 'undefined';
  }

  function ternary(a, b) {
    if (typeof a === 'undefined') {
      return b;
    }

    if (typeof b === 'undefined') {
      return a;
    }

    return a && b;
  }

  Drupal.behaviors.states = {
    attach: function attach(context, settings) {
      var $states = $(context).find('[data-drupal-states]');
      var il = $states.length;

      var _loop = function _loop(i) {
        var config = JSON.parse($states[i].getAttribute('data-drupal-states'));
        Object.keys(config || {}).forEach(function (state) {
          new states.Dependent({
            element: $($states[i]),
            state: states.State.sanitize(state),
            constraints: config[state]
          });
        });
      };

      for (var i = 0; i < il; i++) {
        _loop(i);
      }

      while (states.postponed.length) {
        states.postponed.shift()();
      }
    }
  };

  states.Dependent = function (args) {
    var _this = this;

    $.extend(this, {
      values: {},
      oldValue: null
    }, args);
    this.dependees = this.getDependees();
    Object.keys(this.dependees || {}).forEach(function (selector) {
      _this.initializeDependee(selector, _this.dependees[selector]);
    });
  };

  states.Dependent.comparisons = {
    RegExp: function RegExp(reference, value) {
      return reference.test(value);
    },
    Function: function Function(reference, value) {
      return reference(value);
    },
    Number: function Number(reference, value) {
      return typeof value === 'string' ? _compare2(reference.toString(), value) : _compare2(reference, value);
    }
  };
  states.Dependent.prototype = {
    initializeDependee: function initializeDependee(selector, dependeeStates) {
      var _this2 = this;

      this.values[selector] = {};
      Object.keys(dependeeStates).forEach(function (i) {
        var state = dependeeStates[i];

        if ($.inArray(state, dependeeStates) === -1) {
          return;
        }

        state = states.State.sanitize(state);
        _this2.values[selector][state.name] = null;
        $(selector).on("state:".concat(state), {
          selector: selector,
          state: state
        }, function (e) {
          _this2.update(e.data.selector, e.data.state, e.value);
        });
        new states.Trigger({
          selector: selector,
          state: state
        });
      });
    },
    compare: function compare(reference, selector, state) {
      var value = this.values[selector][state.name];

      if (reference.constructor.name in states.Dependent.comparisons) {
        return states.Dependent.comparisons[reference.constructor.name](reference, value);
      }

      return _compare2(reference, value);
    },
    update: function update(selector, state, value) {
      if (value !== this.values[selector][state.name]) {
        this.values[selector][state.name] = value;
        this.reevaluate();
      }
    },
    reevaluate: function reevaluate() {
      var value = this.verifyConstraints(this.constraints);

      if (value !== this.oldValue) {
        this.oldValue = value;
        value = invert(value, this.state.invert);
        this.element.trigger({
          type: "state:".concat(this.state),
          value: value,
          trigger: true
        });
      }
    },
    verifyConstraints: function verifyConstraints(constraints, selector) {
      var result;

      if ($.isArray(constraints)) {
        var hasXor = $.inArray('xor', constraints) === -1;
        var len = constraints.length;

        for (var i = 0; i < len; i++) {
          if (constraints[i] !== 'xor') {
            var constraint = this.checkConstraints(constraints[i], selector, i);

            if (constraint && (hasXor || result)) {
              return hasXor;
            }

            result = result || constraint;
          }
        }
      } else if ($.isPlainObject(constraints)) {
          for (var n in constraints) {
            if (constraints.hasOwnProperty(n)) {
              result = ternary(result, this.checkConstraints(constraints[n], selector, n));

              if (result === false) {
                return false;
              }
            }
          }
        }

      return result;
    },
    checkConstraints: function checkConstraints(value, selector, state) {
      if (typeof state !== 'string' || /[0-9]/.test(state[0])) {
        state = null;
      } else if (typeof selector === 'undefined') {
        selector = state;
        state = null;
      }

      if (state !== null) {
        state = states.State.sanitize(state);
        return invert(this.compare(value, selector, state), state.invert);
      }

      return this.verifyConstraints(value, selector);
    },
    getDependees: function getDependees() {
      var cache = {};
      var _compare = this.compare;

      this.compare = function (reference, selector, state) {
        (cache[selector] || (cache[selector] = [])).push(state.name);
      };

      this.verifyConstraints(this.constraints);
      this.compare = _compare;
      return cache;
    }
  };

  states.Trigger = function (args) {
    $.extend(this, args);

    if (this.state in states.Trigger.states) {
      this.element = $(this.selector);

      if (!this.element.data("trigger:".concat(this.state))) {
        this.initialize();
      }
    }
  };

  states.Trigger.prototype = {
    initialize: function initialize() {
      var _this3 = this;

      var trigger = states.Trigger.states[this.state];

      if (typeof trigger === 'function') {
        trigger.call(window, this.element);
      } else {
        Object.keys(trigger || {}).forEach(function (event) {
          _this3.defaultTrigger(event, trigger[event]);
        });
      }

      this.element.data("trigger:".concat(this.state), true);
    },
    defaultTrigger: function defaultTrigger(event, valueFn) {
      var oldValue = valueFn.call(this.element);
      this.element.on(event, $.proxy(function (e) {
        var value = valueFn.call(this.element, e);

        if (oldValue !== value) {
          this.element.trigger({
            type: "state:".concat(this.state),
            value: value,
            oldValue: oldValue
          });
          oldValue = value;
        }
      }, this));
      states.postponed.push($.proxy(function () {
        this.element.trigger({
          type: "state:".concat(this.state),
          value: oldValue,
          oldValue: null
        });
      }, this));
    }
  };
  states.Trigger.states = {
    empty: {
      keyup: function keyup() {
        return this.val() === '';
      }
    },
    checked: {
      change: function change() {
        var checked = false;
        this.each(function () {
          checked = $(this).prop('checked');
          return !checked;
        });
        return checked;
      }
    },
    value: {
      keyup: function keyup() {
        if (this.length > 1) {
          return this.filter(':checked').val() || false;
        }

        return this.val();
      },
      change: function change() {
        if (this.length > 1) {
          return this.filter(':checked').val() || false;
        }

        return this.val();
      }
    },
    collapsed: {
      collapsed: function collapsed(e) {
        return typeof e !== 'undefined' && 'value' in e ? e.value : !this.is('[open]');
      }
    }
  };

  states.State = function (state) {
    this.pristine = state;
    this.name = state;
    var process = true;

    do {
      while (this.name.charAt(0) === '!') {
        this.name = this.name.substring(1);
        this.invert = !this.invert;
      }

      if (this.name in states.State.aliases) {
        this.name = states.State.aliases[this.name];
      } else {
        process = false;
      }
    } while (process);
  };

  states.State.sanitize = function (state) {
    if (state instanceof states.State) {
      return state;
    }

    return new states.State(state);
  };

  states.State.aliases = {
    enabled: '!disabled',
    invisible: '!visible',
    invalid: '!valid',
    untouched: '!touched',
    optional: '!required',
    filled: '!empty',
    unchecked: '!checked',
    irrelevant: '!relevant',
    expanded: '!collapsed',
    open: '!collapsed',
    closed: 'collapsed',
    readwrite: '!readonly'
  };
  states.State.prototype = {
    invert: false,
    toString: function toString() {
      return this.name;
    }
  };
  var $document = $(document);
  $document.on('state:disabled', function (e) {
    if (e.trigger) {
      $(e.target).prop('disabled', e.value).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-disabled', e.value).find('select, input, textarea').prop('disabled', e.value);
    }
  });
  $document.on('state:required', function (e) {
    if (e.trigger) {
      if (e.value) {
        var label = "label".concat(e.target.id ? "[for=".concat(e.target.id, "]") : '');
        var $label = $(e.target).attr({
          required: 'required',
          'aria-required': 'true'
        }).closest('.js-form-item, .js-form-wrapper').find(label);

        if (!$label.hasClass('js-form-required').length) {
          $label.addClass('js-form-required form-required');
        }
      } else {
        $(e.target).removeAttr('required aria-required').closest('.js-form-item, .js-form-wrapper').find('label.js-form-required').removeClass('js-form-required form-required');
      }
    }
  });
  $document.on('state:visible', function (e) {
    if (e.trigger) {
      $(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggle(e.value);
    }
  });
  $document.on('state:checked', function (e) {
    if (e.trigger) {
      $(e.target).prop('checked', e.value);
    }
  });
  $document.on('state:collapsed', function (e) {
    if (e.trigger) {
      if ($(e.target).is('[open]') === e.value) {
        $(e.target).find('> summary').trigger('click');
      }
    }
  });
})(jQuery, Drupal);;
/**
 * @file
 * JavaScript behaviors for tableselect enhancements.
 *
 * @see core/misc/tableselect.es6.js
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Initialize and tweak webform tableselect behavior.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformTableSelect = {
    attach: function (context) {
      $(context)
        .find('table.js-webform-tableselect')
        .once('webform-tableselect')
        .each(Drupal.webformTableSelect);
    }
  };

  /**
   * Callback used in {@link Drupal.behaviors.tableSelect}.
   */
  Drupal.webformTableSelect = function () {
    var $table = $(this);

    // Set default table rows to .selected class.
    $table.find('tr').each(function () {
      // Set table row selected for checkboxes.
      var $tr = $(this);
      if ($tr.find('input[type="checkbox"]:checked').length && !$tr.hasClass('selected')) {
        $tr.addClass('selected');
      }
    });

    // Add .selected class event handler to all tableselect elements.
    // Currently .selected is only added to tables with .select-all.
    if ($table.find('th.select-all').length === 0) {
      $table.find('td input[type="checkbox"]:enabled').on('click', function () {
        $(this).closest('tr').toggleClass('selected', this.checked);
      });
    }

    // Add click event handler to the table row that toggles the
    // checkbox or radio.
    $table.find('tr').on('click', function (event) {
      if ($.inArray(event.target.tagName, ['A', 'BUTTON', 'INPUT', 'SELECT']) !== -1) {
        return true;
      }

      var $tr = $(this);
      var $checkbox = $tr.find('td input[type="checkbox"]:enabled, td input[type="radio"]:enabled');
      if ($checkbox.length === 0) {
        return true;
      }

      $checkbox.trigger('click');
    });
  };

})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Drupal) {
  Drupal.theme.checkbox = function () {
    return "<input type=\"checkbox\" class=\"form-checkbox\"/>";
  };
})(Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.tableSelect = {
    attach: function attach(context, settings) {
      $(context).find('th.select-all').closest('table').once('table-select').each(Drupal.tableSelect);
    }
  };

  Drupal.tableSelect = function () {
    if ($(this).find('td input[type="checkbox"]').length === 0) {
      return;
    }

    var table = this;
    var checkboxes;
    var lastChecked;
    var $table = $(table);
    var strings = {
      selectAll: Drupal.t('Select all rows in this table'),
      selectNone: Drupal.t('Deselect all rows in this table')
    };

    var updateSelectAll = function updateSelectAll(state) {
      $table.prev('table.sticky-header').addBack().find('th.select-all input[type="checkbox"]').each(function () {
        var $checkbox = $(this);
        var stateChanged = $checkbox.prop('checked') !== state;
        $checkbox.attr('title', state ? strings.selectNone : strings.selectAll);

        if (stateChanged) {
          $checkbox.prop('checked', state).trigger('change');
        }
      });
    };

    $table.find('th.select-all').prepend($(Drupal.theme('checkbox')).attr('title', strings.selectAll)).on('click', function (event) {
      if ($(event.target).is('input[type="checkbox"]')) {
        checkboxes.each(function () {
          var $checkbox = $(this);
          var stateChanged = $checkbox.prop('checked') !== event.target.checked;

          if (stateChanged) {
            $checkbox.prop('checked', event.target.checked).trigger('change');
          }

          $checkbox.closest('tr').toggleClass('selected', this.checked);
        });
        updateSelectAll(event.target.checked);
      }
    });
    checkboxes = $table.find('td input[type="checkbox"]:enabled').on('click', function (e) {
      $(this).closest('tr').toggleClass('selected', this.checked);

      if (e.shiftKey && lastChecked && lastChecked !== e.target) {
        Drupal.tableSelectRange($(e.target).closest('tr')[0], $(lastChecked).closest('tr')[0], e.target.checked);
      }

      updateSelectAll(checkboxes.length === checkboxes.filter(':checked').length);
      lastChecked = e.target;
    });
    updateSelectAll(checkboxes.length === checkboxes.filter(':checked').length);
  };

  Drupal.tableSelectRange = function (from, to, state) {
    var mode = from.rowIndex > to.rowIndex ? 'previousSibling' : 'nextSibling';

    for (var i = from[mode]; i; i = i[mode]) {
      var $i = $(i);

      if (i.nodeType !== 1) {
        continue;
      }

      $i.toggleClass('selected', state);
      $i.find('input[type="checkbox"]').prop('checked', state);

      if (to.nodeType) {
        if (i === to) {
          break;
        }
      } else if ($.filter(to, [i]).r.length) {
          break;
        }
    }
  };
})(jQuery, Drupal);;
