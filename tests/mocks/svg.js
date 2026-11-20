// Metro turns .svg files into components via react-native-svg-transformer; Jest
// doesn't use Metro, so map them to a plain view that forwards props.
const React = require("react");
const { View } = require("react-native");

const SvgMock = (props) => React.createElement(View, { ...props, testID: props.testID ?? "svg" });
module.exports = SvgMock;
module.exports.default = SvgMock;
