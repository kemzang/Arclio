require "json"
require "http/client"

module AppConfig
  BASE_URL   = "https://api.example.com/v1"
  TIMEOUT    = 30
  MAX_RETRY  = 3
end

def fetch_resource(path : String) : String
  response = HTTP::Client.get("#{AppConfig::BASE_URL}#{path}")
  raise "HTTP #{response.status_code}" unless response.success?
  response.body
end

def parse_json_response(body : String)
  JSON.parse(body)
end

def retry_on_failure(max : Int32, &block)
  attempts = 0
  loop do
    return block.call
  rescue ex
    attempts += 1
    raise ex if attempts >= max
    sleep 1
  end
end

# App-specific: get users
def get_users
  body = fetch_resource("/users")
  parse_json_response(body)
end
