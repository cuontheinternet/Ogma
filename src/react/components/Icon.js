/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

const React = require('react');
const PropTypes = require('prop-types');

const {BulmaSizes} = require('../../typedef');
const ExactTrie = require('../../../../shared/ExactTrie');

const SizeModifiers = ['xs', 'sm'];
const IconSizeTrie = new ExactTrie({ignoreCase: false});
IconSizeTrie.put('music', 1);
IconSizeTrie.put('terminal', 0);

export default class Icon extends React.Component {

    static propTypes = {
        name: PropTypes.string.isRequired,
        size: PropTypes.oneOf(BulmaSizes),
        wrapper: PropTypes.bool,
        style: PropTypes.any,
    };

    static defaultProps = {
        wrapper: true, // Enables Bulma wrapper for the icon
    };

    render() {
        let name = this.props.name;

        let iconClass = 's';
        if (name.charAt(1) === ':') {
            iconClass = name.charAt(0);
            name = name.slice(2);
        }

        let sizeModifier = '';
        let sizeModifierIndex = IconSizeTrie.get(name);
        if (sizeModifierIndex !== undefined) {
            sizeModifier = `fa-${SizeModifiers[sizeModifierIndex]}`;
        }

        const iconClassName = `fa${iconClass} fa-${name} ${sizeModifier}`;

        if (this.props.wrapper) {
            let className = 'icon';
            if (this.props.size) className += ` is-${this.props.size}`;
            return <span className={className} style={this.props.style}>
                <i className={iconClassName}/>
            </span>;
        }

        return <i className={iconClassName} style={this.props.style}/>;
    }

}
