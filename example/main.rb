class Example
  include Dry::Effects.Resolve(
    some_file: "namespace.wrappednamespace.some_file",
    kek: "namespace.wrappednamespace.kek"
  )
end
