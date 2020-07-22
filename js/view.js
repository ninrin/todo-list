/*global qs, qsa, $on, $parent, $delegate */

(function (window) {
	'use strict';

	/**
	     * View that abstracts away the browser's DOM completely.
	     * It has two simple entry points:
	     *
	     *   - bind(eventName, handler)
	     *     Takes a todo application event and registers the handler
	     *   - render(command, parameterObject)
	     *     Renders the given command with the options
	     */
	function View(template) {
		this.template = template;

		this.ENTER_KEY = 13;
		this.ESCAPE_KEY = 27;

		this.$todoList = qs('.todo-list');
		this.$todoItemCounter = qs('.todo-count');
		this.$clearCompleted = qs('.clear-completed');
		this.$main = qs('.main');
		this.$footer = qs('.footer');
		this.$toggleAll = qs('.toggle-all');
		this.$newTodo = qs('.new-todo');
	}

	View.prototype._removeItem = function (id) { // ._ siginifie juste que la propriété est privée?
		var elem = qs('[data-id="' + id + '"]');

		if (elem) {
			this.$todoList.removeChild(elem);
		}
	};

	View.prototype._clearCompletedButton = function (completedCount, visible) {
		this.$clearCompleted.innerHTML = this.template.clearCompletedButton(completedCount);
		this.$clearCompleted.style.display = visible ? 'block' : 'none';
	};

	View.prototype._setFilter = function (currentPage) {
		qs('.filters .selected').className = '';
		qs('.filters [href="#/' + currentPage + '"]').className = 'selected';
	};

	View.prototype._elementComplete = function (id, completed) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		listItem.className = completed ? 'completed' : '';

		// In case it was toggled from an event and not by clicking the checkbox
		qs('input', listItem).checked = completed;
	};

	View.prototype._editItem = function (id, title) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		listItem.className = listItem.className + ' editing';

		var input = document.createElement('input');
		input.className = 'edit';

		listItem.appendChild(input);
		input.focus();
		input.value = title;
	};

	View.prototype._editItemDone = function (id, title) {
		var listItem = qs('[data-id="' + id + '"]');

		if (!listItem) {
			return;
		}

		var input = qs('input.edit', listItem); //donc cible le input dans la portée de listItem (le data-id)
		listItem.removeChild(input);

		listItem.className = listItem.className.replace('editing', ''); // replace sert à changer le mot recherché par un nouveau: replace(searchvalue, newvalue)

		qsa('label', listItem).forEach(function (label) {
			label.textContent = title;
		});
	};

	View.prototype.render = function (viewCmd, parameter) { 
		var self = this;
		var viewCommands = {
			showEntries: function () {
				self.$todoList.innerHTML = self.template.show(parameter); 
			},
			removeItem: function () {
				self._removeItem(parameter);
			},
			updateElementCount: function () {
				self.$todoItemCounter.innerHTML = self.template.itemCounter(parameter);
			},
			clearCompletedButton: function () {
				self._clearCompletedButton(parameter.completed, parameter.visible);
			}, 
			contentBlockVisibility: function () {
				self.$main.style.display = self.$footer.style.display = parameter.visible ? 'block' : 'none';
			},
			toggleAll: function () {
				self.$toggleAll.checked = parameter.checked;
			},
			setFilter: function () {
				self._setFilter(parameter);
			},
			clearNewTodo: function () {
				self.$newTodo.value = '';
			},
			elementComplete: function () {
				self._elementComplete(parameter.id, parameter.completed);
			},
			editItem: function () {
				self._editItem(parameter.id, parameter.title);
			},
			editItemDone: function () {
				self._editItemDone(parameter.id, parameter.title);
			}
		};

		viewCommands[viewCmd]();  // retourne en vue l'élement selectionné


	};

	View.prototype._itemId = function (element) { // met un numéro à un element du li en data
		var li = $parent(element, 'li');
		return parseInt(li.dataset.id, 10);  // parseInt =>  met un string en num
	};

	View.prototype._bindItemEditDone = function (handler) {
		var self = this;
		$delegate(self.$todoList, 'li .edit', 'blur', function () {// (target, selector, type, handler)
			if (!this.dataset.iscanceled) { // si il y a bien un dataset
				handler({
					id: self._itemId(this),// idItem de l'objet = data_id set en objet itemId
					title: this.value // le titre sera le même que celui mis en data_id
				});
			}
		});

		$delegate(self.$todoList, 'li .edit', 'keypress', function (event) {
			if (event.keyCode === self.ENTER_KEY) {
				// Retire le curseur du bouton lorsque l'on appuie sur Entrée.
				// were a real form
				this.blur();
			}
		});
	};

	View.prototype._bindItemEditCancel = function (handler) {
		var self = this;
		$delegate(self.$todoList, 'li .edit', 'keyup', function (event) { // keyup, boutton relaché
			if (event.keyCode === self.ESCAPE_KEY) {
				this.dataset.iscanceled = true; // annule le dataset
				this.blur();

				handler({id: self._itemId(this)});
			}
		});
	};

	View.prototype.bind = function (event, handler) {
		var self = this; // pour eviter les probleme de scope 
		switch (event){ // remplacé par switch
		case 'newTodo':
			$on(self.$newTodo, 'change', function () { // (target, type, callback, useCapture) 
				handler(self.$newTodo.value); // target.addEventListener(type, callback, !!useCapture);
			}); // en gros, ajoute la nouvelle le nouveau element dans la liste
		break;
		
		case 'removeCompleted':
			$on(self.$clearCompleted, 'click', function () { // pour faire fonctionner le boutton 'clear Completed"
				handler();
			});
		break;
		
		case 'toggleAll':
			$on(self.$toggleAll, 'click', function () { // pour faire fonctionner le boutton de deroulement de la listes
				handler({completed: this.checked});
			});
		break;
		
		case 'itemEdit':
			$delegate(self.$todoList, 'li label', 'dblclick', function () { //(target, selector, type, handler) quand on dbclick sur un li, on peut l'éditer
				handler({id: self._itemId(this)});
			});
		break;
		
		case 'itemRemove':
			$delegate(self.$todoList, '.destroy', 'click', function () { // pour faire fonctionner le boutton de la croix qui permet de supprimer la tache
				handler({id: self._itemId(this)}); 
			});
		break;
		
		case 'itemToggle':
			$delegate(self.$todoList, '.toggle', 'click', function () { //pour le bouton sur le coté, qui permet de mettre la tache en completed
				handler({
					id: self._itemId(this),
					completed: this.checked
				})
			});
		break;
		
		case 'itemEditDone':
			self._bindItemEditDone(handler);
		break;
		
		case 'itemEditCancel':
			self._bindItemEditCancel(handler);
		break;
	}
	
	};

	// Export to window
	window.app = window.app || {};
	window.app.View = View;
}(window));
