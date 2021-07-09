import { Component } from "react";
import { sortBy } from "lodash";
import classNames from "classnames";
import "./App.css";
import PropTypes from "prop-types";
import {
  DEFAULT_QUERY,
  DEFAULT_HPP,
  PATH_BASE,
  PATH_SEARCH,
  PARAM_SEARCH,
  PARAM_PAGE,
  PARAM_HPP,
} from "../src/constants";

const SORTS = {
  NONE: (list) => list,
  TITLE: (list) => sortBy(list, "title"),
  AUTHOR: (list) => sortBy(list, "autor"),
  COMMENTS: (list) => sortBy(list, "num_comments").reverse(),
  POINTS: (list) => sortBy(list, "points").reverse(),
};
const updateSearchTopStoriesState = (hits,page) => (prevState)=>{
  const {searchkey,results } = prevState
  const oldHits = results && results[searchkey]? results[searchkey].hits:[];
  const updatedHits = [
    ...oldHits,
    ...hits
  ]
  return{
    results:{
      ...results,
      [searchkey]:{
        hits:updatedHits,
        page
      },
      isLoading:false
    }
  }
}
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      results: null,
      searchkey: "",
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
    };
    this.needsToSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }
  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchkey: searchTerm });
    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm); //再次调用fetch获取服务端数据
    }

    event.preventDefault();
  }
  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true });
    fetch(
      `${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`
    )
      .then((response) => response.json())
      .then((result) => this.setSearchTopStories(result))
      .catch((e) => this.setState({ error: e }));
  }
  setSearchTopStories(result) {
    const { hits, page } = result;
    this.setState(updateSearchTopStoriesState(hits,page));
  } //更新状态
  onSearchChange(event) {
    this.setState({ searchTerm: event.target.value });
  }

  onDismiss(id) {
    const { searchkey, results } = this.state;
    const { hits, page } = results[searchkey];
    const isNotId = (item) => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    this.setState({
      results: { ...results, [searchkey]: { hits: updatedHits, page } },
    });
  }
  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchkey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }
  render() {
    console.log(this.state);
    const { searchTerm, results, searchkey, error, isLoading } = this.state;
    const page =
      (results && results[searchkey] && results[searchkey].page) || 0;
    const list =
      (results && results[searchkey] && results[searchkey].hits) || [];
    return (
      <div className='page'>
        <div className='interactions'>
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}>
            Search
          </Search>
        </div>
        {error ? (
          <div className='interactions'>
            <p>Something went wrong</p>
          </div>
        ) : (
          <Table list={list} onDismiss={this.onDismiss} />
        )}
        <div className='interactions'>
          <ButtonWithLoading
            isLoading={isLoading}
            onClick={() => this.fetchSearchTopStories(searchkey, page + 1)}>
            More
          </ButtonWithLoading>
        </div>
      </div>
    );
  }
}
const Loading = () => <div>Loading...</div>;
const Button = ({ onClick, className, children }) => (
  <button onClick={onClick} className={className}>
    {children}
  </button>
);
Button.defalutProp = {
  className: "",
};
const withLoading =
  (Component) =>
  ({ isLoading, ...rest }) =>
    isLoading ? <Loading /> : <Component {...rest} />;
const ButtonWithLoading = withLoading(Button);
class Search extends Component {
  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }
  render() {
    const { value, onChange, onSubmit, children } = this.props;
    return (
      <form onSubmit={onSubmit}>
        <input
          type='text'
          value={value}
          onChange={onChange}
          ref={(node) => {
            this.input = node;
          }}
        />
        <button type='submit'>{children}</button>
      </form>
    );
  }
}
const Sort = ({ sortKey, onSort, children, activeSortKey }) => {
  const sortClass = classNames("button-inline", {
    "button-active": sortKey === activeSortKey,
  });
  return (
    <Button onClick={() => onSort(sortKey)} className={sortClass}>
      {children}
    </Button>
  );
};
class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: "NONE",
      isSortReverse: false,
    };
    this.onSort = this.onSort.bind(this);
  }

  onSort(sortKey) {
    const isSortReverse =
      this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({
      sortKey,
      isSortReverse,
    });
  }
  render() {
    const { list, onDismiss } = this.props;
    const { sortKey, isSortReverse } = this.state;
    const sortedList = SORTS[sortKey](list);
    const reverseSortedList = isSortReverse ? sortedList.reverse() : sortedList;
    return (
      <div className='table'>
        <div className='table-header'>
          <span style={{ width: "40%" }}>
            <Sort
              sortKey={"TITLE"}
              onSort={this.onSort}
              activeSortKey={sortKey}>
              Title
            </Sort>
          </span>
          <span style={{ width: "30%" }}>
            <Sort
              sortKey={"AUTHOR"}
              onSort={this.onSort}
              activeSortKey={sortKey}>
              AUTHOR
            </Sort>
          </span>
          <span style={{ width: "10%" }}>
            <Sort
              sortKey={"COMMENTS"}
              onSort={this.onSort}
              activeSortKey={sortKey}>
              COMMENTS
            </Sort>
          </span>
          <span style={{ width: "10%" }}>
            <Sort
              sortKey={"POINTS"}
              onSort={this.onSort}
              activeSortKey={sortKey}>
              POINTS
            </Sort>
          </span>
          <span style={{ width: "10%" }}>Archive</span>
        </div>
        {reverseSortedList.map((item) => (
          <div key={item.objectID} className='table-row'>
            <span style={{ width: "40%" }}>
              <a href={item.url}>{item.title}</a>
            </span>
            <span style={{ width: "30%" }}>{item.author}</span>
            <span style={{ width: "10%" }}>{item.num_comments}</span>
            <span style={{ width: "10%" }}>{item.points}</span>
            <span style={{ width: "10%" }}>
              <Button
                onClick={() => onDismiss(item.objectID)}
                className='button-inline'>
                Dismiss
              </Button>
            </span>
          </div>
        ))}
      </div>
    );
  }
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Table.propTypes = {
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
};
export default App;

export { Button, Search, Table };
