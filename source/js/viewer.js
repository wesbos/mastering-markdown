import React from 'react';
import { render } from 'react-dom'
import { Router, Route, Link, IndexRoute, browserHistory } from 'react-router'
import polyfill from './polyfill';

polyfill();

// cowboy in my previous jQuery
const scripts = require('./scripts')();
const data = require('./data');

/*
  Videos Component for displaying a list of all videos
*/
const Videos = React.createClass({
  render : function() {
    return (
      <div className="videos">
        {this.props.videos.map((vid, i) => {
          return <Video {...this.props} vid={vid} i={i} key={i}/>
        })}
      </div>
    )
  }
});


/*
  Listed Video Component
*/
const Video = React.createClass({
  updateHash : function(e) {
    e.preventDefault();
    const { vid } = this.props;

    // check if they have "authenticated"
    if(!!localStorage.mdhash) {
      // TODO: Account for these old urls
      // window.location.hash = "#/view/" + this.props.vid.id;
      this.context.router.push(`/view/${vid.id}`);
      $("html, body").animate({ scrollTop: $('#watch').position().top });
    } else  {
      $("html, body").animate({ scrollTop: $('.signup').position().top }, 1000);
      $('input[name=email]').focus();
      $('p.underline').text('Looks like you aren\'t logged in. Lost your link? Enter your email again and I\'ll re-send the link.').show();
    }
  },
  render : function() {
    var video = this.props.vid;
    return (
      <div className="video">
        <span className="video-number">{this.props.i +  1}</span>
         <a onClick={this.updateHash}>
           <img width="100" height="56.25" src={"https://img.youtube.com/vi/" + video.id + "/mqdefault.jpg"} alt={video.description} />
            <h2>
              {video.title}
              <span className="duration">{video.duration}</span>
            </h2>
           {video.description ? <p className="description">{video.description}</p> : null}
          </a>
      </div>
    )
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  }
});

/*
  Viewer Component
*/

const Viewer = React.createClass({

  getInitialState: function() {
    var params = this.props.params;
    return {
       videos : data.videos,
       video : data.videos[0],
       videoid : params.videoid || data.videos[0].id
    }
  },
  // This gets called right before render - we use it to set some state
  componentWillMount : function() {
    // console.log("viewer updating..");
  },
  goToVideo : function(videoid, e) {
    e.preventDefault();
    console.log("going to video ", videoid);
    this.context.router.push(`/view/${videoid}`);
    this.setState({videoid : videoid});
  },
  renderNavButtons : function() {
    var params = this.props.params;
    var videoid = this.state.videoid;

    // var index = findIndex(this.state.videos,{id : this.state.videoid});
    var index = this.state.videos.findIndex(video => video.id === this.state.videoid);

    var prevVideo = this.state.videos[index - 1];
    var prevButton = (prevVideo ? <a onClick={this.goToVideo.bind(null,prevVideo.id)} href={`#/view/${prevVideo.id}`}>← {prevVideo.title}</a> : '');

    var nextVideo = this.state.videos[index + 1];
    var nextButton = (nextVideo ? <a onClick={this.goToVideo.bind(null,nextVideo.id)} href={`#/view/${nextVideo.id}`}>{nextVideo.title} → </a> : '');

    return (
      <nav className="prev-and-next">
        {prevButton}
        {nextButton}
      </nav>
    )
  },
  render : function() {
    var params = this.props.params;
    var videoid = this.state.videoid;
    var video = this.state.videos.find(video => video.id === videoid)
    var autoplay = (videoid === this.state.videos[0].id ? 0 : 1);

    return (
      <div className="viewer">
        <Player videoid={videoid} autoplay={autoplay}/>
        <div className="video-details">
          <h2>{video.title} - {video.number * 1 + 1} of {this.state.videos.length}</h2>
          {video.description ? <p>{video.description}</p> : null }
          {this.renderNavButtons()}
        </div>
        <Videos {...this.props} videos={this.state.videos} />
      </div>

    )
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  }
});

/*
  Video Player
*/

var Player = React.createClass({
  generateURL : function() {

    return `https://www.youtube.com/embed/${this.props.videoid}?autoplay=${this.props.autoplay}&showinfo=0&rel=0`;
  },
  render : function() {
    return (
      <div className="scaler">
        <iframe width="560" height="315" src={this.generateURL()} frameBorder="0" allowFullScreen></iframe>
      </div>
    )
  }
});

/*
  Authentication
*/

const Auth = React.createClass({
  getInitialState : function() {
    return {
      videos : data.videos
    }
  },
  componentWillMount() {
    localStorage.mdhash = this.props.params.hash;
    this.context.router.push(`/view/${this.state.videos[0].id}`);
  },
  render() {
    return <div></div>
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  }
});

const Main = React.createClass({
  // View the key prop so the viewer will re-render on route update
  render() {
    return <div>{React.cloneElement(this.props.children, { key: this.props.params.videoid })}</div>
  }
});

/*
  Router
*/

var routes = (
  <Router history={browserHistory}>
    <Route path="/" component={Main}>
      <Route name="auth" path="auth/:hash" component={Auth} />
      <Route name="view" path="view/:videoid" component={Viewer}></Route>
      <IndexRoute component={Viewer} />
    </Route>
  </Router>
);

render(routes, document.getElementById('watch'));
