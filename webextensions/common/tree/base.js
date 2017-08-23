/* ***** BEGIN LICENSE BLOCK ***** 
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Tree Style Tab.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2011-2017
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): YUKI "Piro" Hiroshi <piro.outsider.reflex@gmail.com>
 *                 wanabe <https://github.com/wanabe>
 *                 Tetsuharu OHZEKI <https://github.com/saneyuki>
 *                 Xidorn Quan <https://github.com/upsuper> (Firefox 40+ support)
 *                 lv7777 (https://github.com/lv7777)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ******/

var gAllTabs;
var gInternalMovingCount = 0;
var gIsBackground;
var gTargetWindow = null;
var gRestoringTree = false;
var gIndent = -1;
var gIndentProp = 'marginLeft';
var gNeedRestoreTree = false;

var gIsMac = /Darwin/.test(navigator.platform);

function buildTab(aTab, aOptions = {}) {
  log('build tab for ', aTab);

  var item = document.createElement('li');
  item.apiTab = aTab;
  item.setAttribute('id', `tab-${aTab.windowId}-${aTab.id}`);
  item.setAttribute(kCHILDREN, '|');
  item.setAttribute('title', aTab.title);
  item.classList.add('tab');
  if (aTab.active)
    item.classList.add(kTAB_STATE_ACTIVE);
  item.classList.add(kTAB_STATE_SUBTREE_COLLAPSED);

  let label = document.createElement('span');
  label.classList.add(kLABEL);
  label.appendChild(document.createTextNode(aTab.title));
  item.appendChild(label);

  if (!gIsBackground) {
    let twisty = document.createElement('span');
    twisty.classList.add(kTWISTY);
    item.insertBefore(twisty, label);

    let favicon = document.createElement('span');
    favicon.classList.add(kFAVICON);
    favicon.appendChild(document.createElement('img'));
    item.insertBefore(favicon, label);
    favicon.firstChild.src = aTab.favIconUrl || kDEFAULT_FAVICON_URL;

    let closebox = document.createElement('button');
    closebox.appendChild(document.createTextNode('✖'));
    closebox.classList.add(kCLOSEBOX);
    item.appendChild(closebox);
  }

  if (aOptions.existing) {
    item.classList.add(kTAB_STATE_ANIMATION_READY);
  }

  return item;
}

function updateTab(aTab, aParams = {}) {
  if ('label' in aParams)
    getTabLabel(aTab).textContent = aParams.label;

  if ('favicon' in aParams)
    getTabFavicon(aTab).firstChild.src = aParams.favicon;
}

async function selectTabInternally(aTab) {
  log('selectTabInternally: ', dumpTab(aTab));
  var container = aTab.parentNode;
  container.internalFocusCount++;
  if (gIsBackground) {
    await browser.tabs.update(aTab.apiTab.id, { active: true });
  }
  else {
    browser.runtime.sendMessage({
      type:     kCOMMAND_SELECT_TAB_INTERNALLY,
      windowId: aTab.apiTab.windowId,
      tab:      aTab.id
    });
  }
  /**
   * Note: enough large delay is truly required to wait various
   * tab-related operations are processed in background and sidebar.
   */
  setTimeout(() => container.internalFocusCount--,
    configs.acceptableDelayForInternalFocusMoving);
}

function buildTabsContainerFor(aWindowId) {
  var container = document.createElement('ul');
  container.windowId = aWindowId;
  container.setAttribute('id', `window-${aWindowId}`);
  container.classList.add('tabs');
  container.internalFocusCount = 0;
  container.openingCoun = 0;
  return container;
}

function clearAllTabsContainers() {
  var range = document.createRange();
  range.selectNodeContents(gAllTabs);
  range.deleteContents();
  range.detach();
}

function canAnimate() {
  return !gIsBackground && configs.animation;
}
