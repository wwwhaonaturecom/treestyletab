var autoHideFile = baseURL+'../../content/treestyletab/treestyletabbrowser_autoHide.js';

utils.include(baseURL+'../../content/treestyletab/treestyletab.js');
utils.include(autoHideFile);
var TSTBAutoHide = TreeStyleTabBrowserAutoHide;

var autoHide;
var owner;

function setUp()
{
	utils.include(autoHideFile);

	owner = new Mock('owner mock');
	Mock.expect(TreeStyleTabBrowserAutoHide.prototype, 'init', []);
	autoHide = new TreeStyleTabBrowserAutoHide(owner);
}

function tearDown()
{
	owner = null;
}

test_fireStateChangingEvent.parameters = {
	expanded : {
		state : TSTBAutoHide.prototype.kSTATE_EXPANDED,
		shown : true
	},
	shrunken : {
		state : TSTBAutoHide.prototype.kSTATE_SHRUNKEN,
		shown : false
	},
	hidden : {
		state : TSTBAutoHide.prototype.kSTATE_HIDDEN,
		shown : false
	}
};
function test_fireStateChangingEvent(aParameter)
{
	owner.browser = new Mock('browser');
	owner.browser.expect('dispatchEvent', TypeOf(Ci.nsIDOMEvent))
				.then(function(aEvent) {
					assert.equals('TreeStyleTabAutoHideStateChanging', aEvent.type);
					assert.strictlyEquals(aParameter.shown, aEvent.shown);
					assert.equals(aParameter.state, aEvent.state);
				});
	Mock.expectGet(autoHide, 'state', aParameter.state).times(2);

	autoHide.fireStateChangingEvent();
}
