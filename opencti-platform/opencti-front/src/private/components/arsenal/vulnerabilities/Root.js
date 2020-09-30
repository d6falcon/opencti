import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, Redirect, withRouter } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../relay/environment';
import TopBar from '../../nav/TopBar';
import Vulnerability from './Vulnerability';
import VulnerabilityKnowledge from './VulnerabilityKnowledge';
import StixDomainObjectHeader from '../../common/stix_domain_objects/StixDomainObjectHeader';
import FileManager from '../../common/files/FileManager';
import VulnerabilityPopover from './VulnerabilityPopover';
import Loader from '../../../../components/Loader';
import StixCoreObjectHistory from '../../common/stix_core_objects/StixCoreObjectHistory';
import StixCoreObjectOrStixCoreRelationshipContainers from '../../common/containers/StixCoreObjectOrStixCoreRelationshipContainers';
import StixDomainObjectIndicators from '../../observations/indicators/StixDomainObjectIndicators';

const subscription = graphql`
  subscription RootVulnerabilitySubscription($id: ID!) {
    stixDomainObject(id: $id) {
      ... on Vulnerability {
        ...Vulnerability_vulnerability
        ...VulnerabilityEditionContainer_vulnerability
      }
      ...FileImportViewer_entity
      ...FileExportViewer_entity
    }
  }
`;

const vulnerabilityQuery = graphql`
  query RootVulnerabilityQuery($id: String!) {
    vulnerability(id: $id) {
      id
      standard_id
      name
      ...Vulnerability_vulnerability
      ...VulnerabilityReports_vulnerability
      ...VulnerabilityKnowledge_vulnerability
      ...FileImportViewer_entity
      ...FileExportViewer_entity
    }
    connectorsForExport {
      ...FileManager_connectorsExport
    }
  }
`;

class RootVulnerability extends Component {
  componentDidMount() {
    const {
      match: {
        params: { vulnerabilityId },
      },
    } = this.props;
    const sub = requestSubscription({
      subscription,
      variables: { id: vulnerabilityId },
    });
    this.setState({ sub });
  }

  componentWillUnmount() {
    this.state.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { vulnerabilityId },
      },
    } = this.props;
    return (
      <div>
        <TopBar me={me || null} />
        <QueryRenderer
          query={vulnerabilityQuery}
          variables={{ id: vulnerabilityId }}
          render={({ props }) => {
            if (props && props.vulnerability) {
              return (
                <div>
                  <Route
                    exact
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId"
                    render={(routeProps) => (
                      <Vulnerability
                        {...routeProps}
                        vulnerability={props.vulnerability}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId/knowledge"
                    render={() => (
                      <Redirect
                        to={`/dashboard/arsenal/vulnerabilities/${vulnerabilityId}/knowledge/overview`}
                      />
                    )}
                  />
                  <Route
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId/knowledge"
                    render={(routeProps) => (
                      <VulnerabilityKnowledge
                        {...routeProps}
                        vulnerability={props.vulnerability}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId/analysis"
                    render={(routeProps) => (
                      <React.Fragment>
                        <StixDomainObjectHeader
                          stixDomainObject={props.vulnerability}
                          PopoverComponent={<VulnerabilityPopover />}
                        />
                        <StixCoreObjectOrStixCoreRelationshipContainers
                          {...routeProps}
                          stixCoreObjectOrStixCoreRelationshipId={
                            vulnerabilityId
                          }
                        />
                      </React.Fragment>
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId/indicators"
                    render={(routeProps) => (
                      <React.Fragment>
                        <StixDomainObjectHeader
                          stixDomainObject={props.vulnerability}
                          PopoverComponent={<VulnerabilityPopover />}
                          variant='noaliases'
                        />
                        <StixDomainObjectIndicators
                          {...routeProps}
                          stixDomainObjectId={vulnerabilityId}
                          stixDomainObjectLink={`/dashboard/arsenal/vulnerabilities/${vulnerabilityId}/indicators`}
                        />
                      </React.Fragment>
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId/files"
                    render={(routeProps) => (
                      <React.Fragment>
                        <StixDomainObjectHeader
                          stixDomainObject={props.vulnerability}
                          PopoverComponent={<VulnerabilityPopover />}
                        />
                        <FileManager
                          {...routeProps}
                          id={vulnerabilityId}
                          connectorsExport={props.connectorsForExport}
                          entity={props.vulnerability}
                        />
                      </React.Fragment>
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/arsenal/vulnerabilities/:vulnerabilityId/history"
                    render={(routeProps) => (
                      <React.Fragment>
                        <StixDomainObjectHeader
                          stixDomainObject={props.vulnerability}
                          PopoverComponent={<VulnerabilityPopover />}
                        />
                        <StixCoreObjectHistory
                          {...routeProps}
                          stixCoreObjectId={vulnerabilityId}
                        />
                      </React.Fragment>
                    )}
                  />
                </div>
              );
            }
            return <Loader />;
          }}
        />
      </div>
    );
  }
}

RootVulnerability.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootVulnerability);
