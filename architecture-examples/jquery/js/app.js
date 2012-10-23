// url would be usually something like https://api.todo.hood.ie
var hoodie = new Hoodie("http://localhost:9292/localhost:5984");

/*global jQuery, Handlebars */
jQuery(function( $ ) {
	'use strict';

	
	hoodie.funk = 12;

	var Utils = {
		pluralize: function( count, word ) {
			return count === 1 ? word : word + 's';
		}
	};

	var App = {
		init: function() {
			this.ENTER_KEY = 13;
			this.cacheElements();
			this.bindEvents();
			this.render();
		},
		cacheElements: function() {
			this.todoTemplate = Handlebars.compile( $('#todo-template').html() );
			this.footerTemplate = Handlebars.compile( $('#footer-template').html() );
			this.$todoApp = $('#todoapp');
			this.$newTodo = $('#new-todo');
			this.$toggleAll = $('#toggle-all');
			this.$main = $('#main');
			this.$todoList = $('#todo-list');
			this.$footer = this.$todoApp.find('#footer');
			this.$count = $('#todo-count');
			this.$clearBtn = $('#clear-completed');
		},
		bindEvents: function() {
			var list = this.$todoList;
			this.$newTodo.on( 'keyup', this.create );
			this.$toggleAll.on( 'change', this.toggleAll );
			this.$footer.on( 'click', '#clear-completed', this.destroyCompleted );
			list.on( 'change', '.toggle', this.toggle );
			list.on( 'dblclick', 'label', this.edit );
			list.on( 'keypress', '.edit', this.blurOnEnter );
			list.on( 'blur', '.edit', this.update );
			list.on( 'click', '.destroy', this.destroy );

			hoodie.my.store.on('change', this.render.bind(this) )
		},
		render: function() {
			var _this = this;

			hoodie.my.store.findAll('todo')
			.done(function(todos) {
				_this.$todoList.html( _this.todoTemplate( todos ) );
				_this.$main.toggle( !!todos.length );
				_this.$toggleAll.prop( 'checked', !_this.activeTodoCount(todos) );
				_this.renderFooter(todos);
			});
		},
		renderFooter: function(todos) {
			var todoCount = todos.length,
				activeTodoCount = this.activeTodoCount(todos),
				footer = {
					activeTodoCount: activeTodoCount,
					activeTodoWord: Utils.pluralize( activeTodoCount, 'item' ),
					completedTodos: todoCount - activeTodoCount
				};

			this.$footer.toggle( !!todoCount );
			this.$footer.html( this.footerTemplate( footer ) );
		},
		toggleAll: function() {
			var isChecked = $( this ).prop('checked');
			hoodie.myStore.updateAll('todo', {
				completed: isChecked
			});
		},
		activeTodoCount: function(todos) {
			var count = 0;
			$.each( todos, function( i, val ) {
				if ( !val.completed ) {
					count++;
				}
			});
			return count;
		},
		destroyCompleted: function() {
			hoodie.my.store.destroyAll( function(todo) {
				return todo.completed
			})
		},
		// Accepts an element from inside the ".item" div and
		// returns the corresponding todo in the todos array
		getTodo: function( elem, callback ) {
			var id = $( elem ).closest('li').data('id');
			hoodie.my.store.find('todo', id)
			.done(callback)
		},
		create: function(e) {
			var $input = $(this),
				val = $.trim( $input.val() );
			if ( e.which !== App.ENTER_KEY || !val ) {
				return;
			}
			hoodie.my.store.create('todo', {
				title: val,
				completed: false
			})
			$input.val('');
		},
		toggle: function() {
			App.getTodo( this, function( todo ) {
				hoodie.my.store.update('todo', todo.id, {
					completed: ! todo.completed
				})
			});
		},
		edit: function() {
			$(this).closest('li').addClass('editing').find('.edit').focus();
		},
		blurOnEnter: function( e ) {
			if ( e.keyCode === App.ENTER_KEY ) {
				e.target.blur();
			}
		},
		update: function() {
			var val = $.trim( $(this).removeClass('editing').val() );
			App.getTodo( this, function( todo ) {
				if ( val ) {
					hoodie.my.store.update('todo', todo.id, {
						title : val
					})
				} else {
					hoodie.my.store.destroy('todo', todo.id)
				}
			});
		},
		destroy: function() {
			App.getTodo( this, function( todo ) {
				hoodie.my.store.destroy('todo', todo.id)
			});
		}
	};

	App.init();

});
