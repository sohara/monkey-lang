package evaluator

import (
	"monkey-lang/ast"
	"monkey-lang/object"
)

func quote(node ast.Node) object.Object {
	return &object.Quote{Node: node}
}
