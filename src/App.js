import React, { Component } from 'react';

import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import t from 'tcomb-form';
import jwt_decode from 'jwt-decode';

import Dashboard from './components/Dashboard';
import Canvassers from './components/Canvassers';
import Teams from './components/Teams';
import Turf from './components/Turf';
import Questions from './components/Questions';
import Forms from './components/Forms';
import Map from './components/Map';
import Jwt from './components/Jwt';

import { ack, wsbase } from './config.js';

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      jwt: sessionStorage.getItem('jwt'),
      server: sessionStorage.getItem('server'),
      connectForm: {server: wsbase, ack: ack},
    };

    this.formServerItems = t.struct({
      server: t.String,
      ack: t.subtype(t.Boolean, function (s) { return s }), // boolean that fails validation if not selected
    });

    this.formServerOptions = {
      fields: {
        server: {
          label: 'Server Domain Name',
          help: 'Enter the domain name of the server you wish to connect to.',
          error: 'You must enter a domain name.',
        },
        ack: {
          label: 'Terms of Use',
          help: 'By checking this you acknowledge that the server to which you are connecting is not affiliated with Our Voice USA and the data you send and receive is governed by that server\'s terms of use.',
          error: 'You must acknowledge the terms of use.',
        },
      },
    };

    this.onChange = this.onChange.bind(this);
    this.doSave = this.doSave.bind(this);
  }

  onChange(connectForm) {
    this.setState({connectForm})
  }

  getName() {
    let name;

    try {
      name = jwt_decode(this.state.jwt).name;
    } catch (e) {
      console.warn(e);
    }

    return name;
  }

  _logout() {
    sessionStorage.removeItem('server');
    sessionStorage.removeItem('jwt');
    this.setState({server: null, jwt: null});
  }

  doSave = async () => {

    let json = this.refs.mainForm.getValue();
    if (json === null) return;

    if (json.ack !== true) return;

    let ret = await this.singHello(json.server);

    if (ret.flag !== true) console.warn((ret.error?'Error':'Connection Successful'), ret.msg, [{text: 'OK'}], { cancelable: false });
    else console.warn(ret)

  }

  singHello = async (server) => {
    let res;

    sessionStorage.setItem('server', server);

    try {
      res = await fetch('https://'+server+'/canvass/v1/hello', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer '+(this.state.jwt?this.state.jwt:"of the one ring"),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({longitude: -118, latitude: 40}),
      });

      switch (res.status) {
        case 200:
          break; // valid - break to proceed
        case 400:
          return {error: true, msg: "The server didn't understand the request sent from this device."};
        case 401:
          window.location.href = "https://"+wsbase+"/auth/gm";
          return {error: false, flag: true};
        case 403:
          return {error: true, msg: "We're sorry, but your request to canvass with this server has been rejected."};
        default:
          return {error: true, msg: "Unknown error connecting to server."};
      }

      let body = await res.json();

      console.warn(body);

      this.setState({server: server});
      sessionStorage.setItem('server', server);

      if (body.data.ready !== true) return {error: false, msg: "The server said: "+body.msg};
      else {
        // TODO: use form data from body.data.forms[0] and save it in the forms_local cache
        // TODO: if there's more than one form in body.data.forms - don't navigate
        console.warn({server: server, dbx: null, user: this.state.user});
        return {error: false, flag: true};
      }
    } catch (e) {
      console.warn("singHello: "+e);
      return {error: true, msg: "Unable to make a connection to target server"};
    }

  }

  render() {
    const { server, jwt } = this.state;

    if (!server) {
      return (
        <div align="center">
          <h3>HelloVoter</h3>
          <t.form.Form
            ref="mainForm"
            type={this.formServerItems}
            options={this.formServerOptions}
            onChange={this.onChange}
            value={this.state.connectForm}
          />
          <button onClick={this.doSave}>
            Connect to Server
          </button>
        </div>
      );
    }

    // TODO: this is a hack to load the new session from the /jwt/ redirect back to here. Need a cleaner way
    if (!jwt) window.location.reload();

    return (
    <Router>
      <Root>
        <Sidebar>
          <div>Welcome, {this.getName()}!</div>
          <SidebarItem><Link to={'/'}>Dashboard</Link></SidebarItem>
          <SidebarItem><Link to={'/canvassers/'}>Canvassers</Link></SidebarItem>
          <SidebarItem><Link to={'/teams/'}>Teams</Link></SidebarItem>
          <SidebarItem><Link to={'/turf/'}>Turf</Link></SidebarItem>
          <SidebarItem><Link to={'/questions/'}>Questions</Link></SidebarItem>
          <SidebarItem><Link to={'/forms/'}>Forms</Link></SidebarItem>
          <SidebarItem><Link to={'/map/'}>Map</Link></SidebarItem>
          <SidebarItem><button onClick={() => this._logout()}>Logout</button></SidebarItem>
        </Sidebar>
        <Main>
          <Route exact={true} path="/" component={Dashboard} />
          <Route path="/canvassers/" render={() => <Canvassers server={server} jwt={jwt} />} />
          <Route path="/teams/" render={() => <Teams server={server} jwt={jwt} />} />
          <Route path="/turf/" render={() => <Turf server={server} jwt={jwt} />} />
          <Route path="/questions/" component={Questions} />
          <Route path="/forms/" component={Forms} />
          <Route path="/map/" render={() => <Map server={server} jwt={jwt} />} />
          <Route path="/jwt/" component={Jwt} />
        </Main>
      </Root>
    </Router>
    );
  }
}

const Root = (props) => (
  <div style={{display: 'flex'}} {...props}/>
)

const Sidebar = (props) => (
  <div style={{width: '22vw', height: '100vh', overlow: 'auto', background: '#eee'}} {...props}/>
)

const SidebarItem = (props) => (
  <div style={{whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', padding: '5px 10px'}} {...props}/>
)

const Main = (props) => (
  <div style={{flex: 1, height: '100vh', overflow: 'auto'}}>
    <div style={{padding: '20px'}} {...props}/>
  </div>
)

export default App;
